/**
 * GET /dashboard
 * - Staff (dashboard:read) → admin ops overview
 * - Student → home aggregate
 */
import type { NextFunction, Request, Response } from 'express';

import { getAdminDashboardOverview } from '../services/adminDashboard.service';
import { getDashboardForUser } from '../services/dashboard.service';
import { hasStaffPermission } from '../services/role.service';
import { AppError } from '../utils/AppError';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const staffDashboard = await hasStaffPermission(
      userId,
      'dashboard:read',
      req.user?.email,
    );

    if (staffDashboard) {
      const data = await getAdminDashboardOverview();
      res.status(200).json({ success: true, data });
      return;
    }

    const data = await getDashboardForUser(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
