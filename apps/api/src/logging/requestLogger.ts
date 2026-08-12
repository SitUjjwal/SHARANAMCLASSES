/**
 * API request logging middleware — method, path, status, duration, request id.
 * Writes category `api` (access + app rotating files).
 */
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../logging/logger';
import { metricsStore } from '../monitoring/metricsStore';

const SKIP_PREFIXES = [
  '/health',
  '/ready',
  '/version',
  '/release-notes',
  '/metrics',
  '/system-status',
  '/admin/monitoring',
  '/monitoring',
];

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const path = req.path || req.url || '';
  if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    next();
    return;
  }

  const started = Date.now();

  res.on('finish', () => {
    const status = res.statusCode;
    const durationMs = Date.now() - started;
    const level =
      status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    metricsStore.recordApiRequest({
      method: req.method,
      path,
      status,
      durationMs,
    });

    logger.api(
      `${req.method} ${path} ${status}`,
      {
        method: req.method,
        path,
        status,
        duration_ms: durationMs,
        request_id: req.requestId,
        user_id: req.user?.id,
        ip: req.ip,
        user_agent: req.get('user-agent')?.slice(0, 200),
        content_length: res.getHeader('content-length'),
      },
      level,
    );
  });

  next();
}
