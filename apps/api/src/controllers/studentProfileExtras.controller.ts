/**
 * Achievement + learning-progress HTTP handlers.
 * Certificates: see certificate.controller.ts
 */
import type { NextFunction, Request, Response } from 'express';

import { listAchievementsForUser } from '../services/achievement.service';
import { getLearningProgressForUser } from '../services/learningProgress.service';

export async function listAchievements(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    const data = await listAchievementsForUser(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getLearningProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    const data = await getLearningProgressForUser(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
