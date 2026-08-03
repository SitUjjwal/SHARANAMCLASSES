/**
 * Auth staff bootstrap — promotes ADMIN_EMAILS → super_admin and returns RBAC role.
 * Used by admin UI so RequireStaff works even when profiles.role is still student.
 *
 *   GET /auth/staff-context
 */
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { requireAuth } from '../middlewares/auth';
import { resolveStaffContext } from '../services/role.service';
import { AppError } from '../utils/AppError';

export const staffAuthRouter = Router();

async function getStaffContextHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const ctx = await resolveStaffContext(req.user.id, req.user.email);
    res.status(200).json({
      success: true,
      data: ctx
        ? {
            is_staff: true,
            role: ctx.role,
            profile_role: ctx.profileRole,
            permissions: ctx.permissions,
            email: ctx.email,
          }
        : {
            is_staff: false,
            role: null,
            profile_role: null,
            permissions: [],
            email: req.user.email ?? null,
          },
    });
  } catch (error) {
    next(error);
  }
}

staffAuthRouter.get('/auth/staff-context', requireAuth, getStaffContextHandler);
