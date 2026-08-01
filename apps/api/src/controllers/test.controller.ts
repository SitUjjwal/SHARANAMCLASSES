/**
 * test.controller.ts — Test Series HTTP adapters.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createTest,
  deleteTest,
  getTestForAdmin,
  listTestsForAdmin,
  listTestsPublic,
  updateTest,
} from '../services/test.service';
import type {
  CreateTestInput,
  ListTestsQuery,
  UpdateTestInput,
} from '../validators/test.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import {
  listAccessibleCourseIds,
  userHasCourseAccess,
} from '../services/courseAccess.service';
import type { TestType } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

/** GET /tests — admin list */
export async function listTests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as ListTestsQuery;
    const data = await listTestsForAdmin(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /tests/:id — admin detail */
export async function getTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.id, 'id');
    const data = await getTestForAdmin(testId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /tests */
export async function postTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateTestInput;
    const data = await createTest(input);
    res.status(201).json({ success: true, data, message: 'Test created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /tests/:id */
export async function putTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateTestInput;
    const data = await updateTest(testId, input);
    res.status(200).json({ success: true, data, message: 'Test updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /tests/:id */
export async function removeTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.id, 'id');
    await deleteTest(testId);
    res.status(200).json({ success: true, data: null, message: 'Test deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /student/tests — published tests for the signed-in student.
 * Query: courseId, chapterId, testType
 */
export async function listStudentTests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId =
      typeof req.query.courseId === 'string' && req.query.courseId
        ? req.query.courseId
        : undefined;
    const chapterId =
      typeof req.query.chapterId === 'string' && req.query.chapterId
        ? req.query.chapterId
        : undefined;
    const testType =
      typeof req.query.testType === 'string' && req.query.testType !== 'all'
        ? (req.query.testType as TestType)
        : undefined;

    const enrolledCourseIds = courseId
      ? (await userHasCourseAccess(userId, courseId)
          ? new Set([courseId])
          : new Set<string>())
      : await listAccessibleCourseIds(userId);

    const data = await listTestsPublic({
      courseId,
      chapterId,
      testType,
      enrolledCourseIds,
    });
    res.status(200).json({ success: true, data: { items: data } });
  } catch (error) {
    next(error);
  }
}
