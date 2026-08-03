/**
 * requireAdmin — staff with admin-tier role (super_admin | admin).
 * Prefer requirePermission(module:action) for module CRUD gates.
 * Kept for legacy routes; also accepts teacher/support when they have the mapped permission via requirePermission.
 */
import type { NextFunction, Request, Response } from 'express';

import { resolveStaffContext } from '../services/role.service';
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

    const ctx = await resolveStaffContext(req.user.id, req.user.email);
    if (!ctx) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Staff access required. Set profiles.role to super_admin, admin, teacher, or support (or add your email to ADMIN_EMAILS).',
      );
    }

    // Legacy requireAdmin = full admin ops. Teacher/support must use requirePermission routes.
    if (ctx.role !== 'super_admin' && ctx.role !== 'admin') {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Admin role required (got ${ctx.role}). This endpoint still uses requireAdmin — use a permission-gated route or elevate role.`,
      );
    }

    req.staff = ctx;
    next();
  } catch (error) {
    next(error);
  }
}
