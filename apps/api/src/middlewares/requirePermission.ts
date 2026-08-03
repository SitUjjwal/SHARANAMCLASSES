/**
 * requirePermission — gate admin routes by module CRUD permission.
 * Must run after requireAuth.
 */
import type { NextFunction, Request, Response } from 'express';
import type { AdminPermission } from '@sharanam/shared';

import { assertStaffPermission } from '../services/role.service';
import { AppError } from '../utils/AppError';

type Mode = 'any' | 'all';

export function requirePermission(
  permission: AdminPermission | AdminPermission[],
  mode: Mode = 'any',
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
      }

      const ctx = await assertStaffPermission(
        req.user.id,
        permission,
        req.user.email,
        mode,
      );
      req.staff = ctx;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Any authenticated staff role (portal access). Prefer requirePermission for modules. */
export async function requireStaff(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }

    const ctx = await assertStaffPermission(
      req.user.id,
      'dashboard:read',
      req.user.email,
    );
    req.staff = ctx;
    next();
  } catch (error) {
    next(error);
  }
}
