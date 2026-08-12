/**
 * Liveness (`/health`) and readiness (`/ready`) probes.
 * - Liveness: process is up (Docker HEALTHCHECK / restart policy).
 * - Readiness: can accept traffic (DB reachable, not shutting down).
 */
import type { Request, Response } from 'express';

import { env } from '../config/env';
import { isAcceptingTraffic } from '../config/lifecycle';
import { checkDatabaseStatus } from '../services/database.service';

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    app_env: env.APP_ENV,
    node_env: env.NODE_ENV,
    uptime_s: Math.floor(process.uptime()),
  });
}

export async function getReady(_req: Request, res: Response): Promise<void> {
  if (!isAcceptingTraffic()) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'shutting_down',
      app_env: env.APP_ENV,
      checks: { database: 'skipped' },
    });
    return;
  }

  try {
    await checkDatabaseStatus();
    res.status(200).json({
      status: 'ready',
      app_env: env.APP_ENV,
      node_env: env.NODE_ENV,
      checks: { database: 'ok' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'database check failed';
    res.status(503).json({
      status: 'not_ready',
      reason: 'dependency_unhealthy',
      app_env: env.APP_ENV,
      checks: { database: 'fail', detail: message },
    });
  }
}
