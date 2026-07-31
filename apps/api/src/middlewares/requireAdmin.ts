/**
 * requireAdmin — only profiles with role=admin (or ADMIN_EMAILS) may mutate catalog.
 * Must run after requireAuth (needs req.user.id).
 */
import type { NextFunction, Request, Response } from 'express';

import { isAdminUser } from '../services/role.service';
import { AppError } from '../utils/AppError';

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }

    const admin = await isAdminUser(req.user.id, req.user.email);
    if (!admin) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Admin access required. Set profiles.role = admin or add your email to ADMIN_EMAILS in apps/api/.env',
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
