/**
 * Placeholder — validate Supabase JWT and attach user to request.
 */
import type { NextFunction, Request, Response } from 'express';

export function requireAuth(_req: Request, _res: Response, next: NextFunction): void {
  // TODO: Verify Supabase access token
  next();
}
