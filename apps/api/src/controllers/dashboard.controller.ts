/**
 * GET /dashboard — Home screen payload for the signed-in student.
 */
import type { NextFunction, Request, Response } from 'express';

import { getDashboardForUser } from '../services/dashboard.service';
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
    const data = await getDashboardForUser(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
