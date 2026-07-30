/**
 * Placeholder — enforce admin role after authentication.
 */
import type { NextFunction, Request, Response } from 'express';

export function requireAdmin(_req: Request, _res: Response, next: NextFunction): void {
  // TODO: Check user role from Supabase claims / profiles table
  next();
}
