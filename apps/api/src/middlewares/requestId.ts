/**
 * Attach a short request id for logs / client correlation.
 */
import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-request-id');
  const id =
    incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
