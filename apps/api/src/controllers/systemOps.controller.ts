/**
 * Production ops API surface:
 *   GET  /health          (exists — health.routes)
 *   GET  /metrics
 *   GET  /logs
 *   POST /backup
 *   POST /restore
 *   GET  /system-status
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { env } from '../config/env';
import { logger } from '../logging/logger';
import { metricsStore } from '../monitoring/metricsStore';
import { alertStore } from '../monitoring/alertStore';
import { listAdminActivityLogs } from '../services/adminOps.service';
import { restoreBackup, runBackup } from '../services/backup.service';
import { checkDatabaseStatus } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { restoreBackupSchema } from '../validators/backup.validators';

function assertUser(req: Request): { id: string } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return { id: req.user.id };
}

/** GET /metrics — live process metrics (same payload as monitoring overview). */
export function getMetricsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const overview = metricsStore.getOverview();
    alertStore.evaluate(overview);
    overview.alerts = alertStore.list(30);
    overview.active_alert_count = alertStore.activeCount();
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

async function readLogFileTail(
  kind: 'app' | 'error' | 'access',
  lines: number,
): Promise<{ file: string | null; lines: string[] }> {
  const dir = logger.getLogDir();
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const candidates = [
    path.join(dir, `${kind}-${stamp}.log`),
    path.join(dir, `${kind}.log`),
  ];

  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const all = raw.split(/\r?\n/).filter(Boolean);
      return { file, lines: all.slice(-Math.max(1, Math.min(lines, 500))) };
    } catch {
      // try next candidate
    }
  }
  return { file: null, lines: [] };
}

/** GET /logs?source=activity|file&kind=app|error|access */
export async function getLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const source =
      typeof req.query.source === 'string' ? req.query.source : 'activity';

    if (source === 'file') {
      const kindRaw =
        typeof req.query.kind === 'string' ? req.query.kind : 'error';
      const kind =
        kindRaw === 'app' || kindRaw === 'access' || kindRaw === 'error'
          ? kindRaw
          : 'error';
      const lines = Number(req.query.lines ?? 100) || 100;
      const data = await readLogFileTail(kind, lines);
      res.status(200).json({
        success: true,
        data: {
          source: 'file',
          kind,
          log_dir: logger.getLogDir(),
          ...data,
        },
      });
      return;
    }

    const page = Number(req.query.page ?? 1) || 1;
    const pageSize = Number(req.query.pageSize ?? 25) || 25;
    const action =
      typeof req.query.action === 'string' ? req.query.action : undefined;
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoryRaw =
      typeof req.query.category === 'string' ? req.query.category : 'all';
    const allowed = new Set(['auth', 'payment', 'profile', 'course', 'admin', 'all']);
    const category = allowed.has(categoryRaw)
      ? (categoryRaw as 'auth' | 'payment' | 'profile' | 'course' | 'admin' | 'all')
      : 'all';

    const data = await listAdminActivityLogs({
      page,
      pageSize,
      action,
      search,
      category,
    });
    res.status(200).json({ success: true, data: { source: 'activity', ...data } });
  } catch (error) {
    next(error);
  }
}

/** POST /backup — trigger manual backup */
export async function postBackupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = assertUser(req);
    const data = await runBackup({ trigger: 'manual', actorId: user.id });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

const restoreBodySchema = restoreBackupSchema.extend({
  runId: z.string().uuid(),
});

/** POST /restore — body: { runId, mode? } */
export async function postRestoreHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const parsed = restoreBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Invalid restore payload (runId uuid required)',
        parsed.error.flatten(),
      );
    }
    const data = await restoreBackup({
      runId: parsed.data.runId,
      mode: parsed.data.mode,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /system-status — API + DB + process snapshot */
export async function getSystemStatusHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const started = Date.now();
    let database: { ok: boolean; status: string; error?: string } = {
      ok: false,
      status: 'unknown',
    };

    try {
      const db = await checkDatabaseStatus();
      database = { ok: true, status: db.status };
    } catch (error) {
      database = {
        ok: false,
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }

    const overview = metricsStore.getOverview();
    const mem = process.memoryUsage();

    res.status(database.ok ? 200 : 503).json({
      success: database.ok,
      data: {
        api: {
          status: 'ok',
          env: env.NODE_ENV,
          uptime_sec: Math.round(process.uptime()),
          checked_in_ms: Date.now() - started,
        },
        database,
        process: {
          pid: process.pid,
          node: process.version,
          rss_mb: Math.round(mem.rss / 1024 / 1024),
          heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        },
        metrics_window: {
          failed_requests: overview.failures.failed_requests,
          failed_payments: overview.failures.failed_payments,
          notification_failures: overview.failures.notification_failures,
          api_latency_p95_ms: overview.api.latency.p95_ms,
        },
        time: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
