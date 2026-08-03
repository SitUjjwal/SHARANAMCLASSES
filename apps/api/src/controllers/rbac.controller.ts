/**
 * RBAC HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';
import { RBAC_ROLES, type RbacRole } from '@sharanam/shared';

import {
  getRbacCatalog,
  listStaffMembers,
  updateStaffRole,
} from '../services/rbac.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertStaff(req: Request) {
  if (!req.staff) {
    throw new AppError(403, 'FORBIDDEN', 'Staff context missing');
  }
  return req.staff;
}

/** GET /admin/rbac/me */
export async function getMyRbacHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const staff = assertStaff(req);
    res.status(200).json({
      success: true,
      data: {
        user_id: staff.userId,
        email: staff.email,
        profile_role: staff.profileRole,
        role: staff.role,
        role_label:
          staff.role === 'super_admin'
            ? 'Super Admin'
            : staff.role === 'admin'
              ? 'Admin'
              : staff.role === 'teacher'
                ? 'Teacher'
                : 'Support Staff',
        permissions: staff.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/rbac/matrix */
export async function getRbacMatrixHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertStaff(req);
    res.status(200).json({ success: true, data: getRbacCatalog() });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/rbac/staff */
export async function listRbacStaffHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertStaff(req);
    const data = await listStaffMembers();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/rbac/staff/:userId */
export async function patchStaffRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const staff = assertStaff(req);
    const userId = requireParam(req.params.userId, 'userId');

    const nextRole = (req.body as { role?: string })?.role;
    if (!nextRole || !(RBAC_ROLES as readonly string[]).includes(nextRole)) {
      throw new AppError(
        400,
        'INVALID_ROLE',
        `role must be one of: ${RBAC_ROLES.join(', ')}`,
      );
    }

    const data = await updateStaffRole({
      actorId: staff.userId,
      actorEmail: staff.email,
      actorRole: staff.role,
      targetUserId: userId,
      nextRole: nextRole as RbacRole,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
