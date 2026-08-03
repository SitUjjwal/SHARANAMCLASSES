/**
 * reject non-HTTPS in production when behind TLS-terminating proxy
 * (expects X-Forwarded-Proto from the load balancer).
 */
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function enforceHttps(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (env.NODE_ENV !== 'production') {
    next();
    return;
  }

  const proto = (req.header('x-forwarded-proto') || req.protocol || '').toLowerCase();
  if (proto && proto !== 'https') {
    next(
      new AppError(400, 'HTTPS_REQUIRED', 'HTTPS is required in production'),
    );
    return;
  }

  next();
}
