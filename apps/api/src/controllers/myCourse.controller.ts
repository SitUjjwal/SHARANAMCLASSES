/**
 * myCourse.controller.ts — HTTP handlers for My Courses.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  listMyCourses,
  updateLastWatchedChapter,
} from '../services/myCourse.service';
import type {
  ListMyCoursesQuery,
  UpdateLastWatchedInput,
} from '../validators/myCourse.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

/** GET /my-courses */
export async function getMyCourses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const query = req.query as unknown as ListMyCoursesQuery;
    const data = await listMyCourses(userId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /my-courses/:courseId/last-watched */
export async function patchLastWatched(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = requireParam(req.params.courseId, 'courseId');
    const input = req.body as UpdateLastWatchedInput;
    const data = await updateLastWatchedChapter(userId, courseId, input);
    res.status(200).json({ success: true, data, message: 'Progress updated' });
  } catch (error) {
    next(error);
  }
}
