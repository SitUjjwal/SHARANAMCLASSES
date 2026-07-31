/**
 * myCourse.routes.ts
 *
 *   GET   /my-courses
 *   PATCH /my-courses/:courseId/last-watched
 */
import { Router } from 'express';

import { getMyCourses, patchLastWatched } from '../controllers/myCourse.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  listMyCoursesQuerySchema,
  updateLastWatchedSchema,
} from '../validators/myCourse.validators';

export const myCourseRouter = Router();

myCourseRouter.get(
  '/my-courses',
  requireAuth,
  validate(listMyCoursesQuerySchema, 'query'),
  getMyCourses,
);

myCourseRouter.patch(
  '/my-courses/:courseId/last-watched',
  requireAuth,
  validate(updateLastWatchedSchema),
  patchLastWatched,
);
