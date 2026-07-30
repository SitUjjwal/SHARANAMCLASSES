/**
 * Auth middleware placeholder — JWT verification will be wired here later.
 * No routes require authentication yet.
 */
import type { NextFunction, Request, Response } from 'express';

export function requireAuth(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
