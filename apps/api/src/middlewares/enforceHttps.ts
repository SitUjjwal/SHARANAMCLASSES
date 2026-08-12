/**
 * Reject cleartext only when a reverse proxy explicitly forwarded `http`.
 * Internal probes (Docker HEALTHCHECK → 127.0.0.1) have no X-Forwarded-Proto
 * and must still succeed. Real clients behind Caddy/nginx get https.
 */
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const SKIP_PATHS = new Set(['/health', '/ready']);

export function enforceHttps(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const path = req.path || '';
  if (SKIP_PATHS.has(path) || path.startsWith('/health/') || path.startsWith('/ready/')) {
    next();
    return;
  }

  const forwarded = req.header('x-forwarded-proto');
  if (!forwarded) {
    // Direct / internal access (healthcheck, sidecar) — no proxy header
    next();
    return;
  }

  const proto = forwarded.split(',')[0]?.trim().toLowerCase() ?? '';
  if (proto && proto !== 'https') {
    next(
      new AppError(400, 'HTTPS_REQUIRED', 'HTTPS is required in production'),
    );
    return;
  }

  next();
}
