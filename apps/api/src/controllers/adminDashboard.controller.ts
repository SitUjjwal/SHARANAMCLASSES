/**
 * Admin dashboard overview controller.
 */
import type { NextFunction, Request, Response } from 'express';

import { getAdminDashboardOverview } from '../services/adminDashboard.service';
import { AppError } from '../utils/AppError';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** GET /admin/dashboard/overview */
export async function getAdminDashboardOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const data = await getAdminDashboardOverview();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
