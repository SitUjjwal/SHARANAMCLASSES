/**
 * analytics.controller.ts — student Test Analytics Dashboard.
 */
import type { NextFunction, Request, Response } from 'express';

import { getStudentTestAnalytics } from '../services/analytics.service';
import { AppError } from '../utils/AppError';

function assertUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return userId;
}

/** GET /student/analytics */
export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await getStudentTestAnalytics(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
