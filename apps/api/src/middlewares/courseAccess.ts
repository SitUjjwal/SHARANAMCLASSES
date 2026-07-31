/**
 * courseAccess middleware — gates student content by purchase/enrollment.
 *
 * Must run after `requireAuth`.
 *
 * Behavior (soft gate — preview allowed):
 *   purchased OR enrolled  →  req.courseAccess.mode = 'full'
 *   otherwise              →  req.courseAccess.mode = 'preview'
 *
 * Controllers/services use `hasFullAccess` to return all media URLs
 * or only free-preview URLs (paid URLs stripped / locked).
 *
 * Usage:
 *   router.get('/courses/:id/content', requireAuth, attachCourseAccessFromCourse, handler)
 *   router.get('/chapters/:id/videos', requireAuth, attachCourseAccessFromChapter, handler)
 */
import type { NextFunction, Request, Response } from 'express';

import {
  buildChapterCourseAccess,
  buildCourseAccess,
} from '../services/courseAccess.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

/**
 * Resolve course from `:id` or `:courseId`, attach access context.
 */
export async function attachCourseAccessFromCourse(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = requireParam(req.params.courseId ?? req.params.id, 'courseId');
    req.courseAccess = await buildCourseAccess(userId, courseId);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve course from chapter `:id` or `:chapterId`, attach access context.
 */
export async function attachCourseAccessFromChapter(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const chapterId = requireParam(req.params.chapterId ?? req.params.id, 'chapterId');
    req.courseAccess = await buildChapterCourseAccess(userId, chapterId);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Hard gate: reject when the student has not purchased/enrolled.
 * Use only on endpoints that must never serve preview (rare).
 */
export async function requireFullCourseAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.courseAccess) {
      throw new AppError(
        500,
        'COURSE_ACCESS_MISSING',
        'attachCourseAccess middleware must run before requireFullCourseAccess',
      );
    }
    if (!req.courseAccess.hasFullAccess) {
      throw new AppError(
        403,
        'COURSE_NOT_PURCHASED',
        'Purchase or enroll in this course to access this content',
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}
