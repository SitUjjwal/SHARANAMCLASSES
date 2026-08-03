/**
 * Teacher routes (admin).
 *
 * Canonical:
 *   GET|POST           /teachers
 *   PUT|DELETE         /teachers/:id
 *
 * Also kept:
 *   /admin/teachers… (detail, stats, assign courses/live classes)
 */
import { Router } from 'express';

import {
  deleteTeacherHandler,
  getTeacherHandler,
  getTeacherStatsHandler,
  listAssignableCoursesHandler,
  listAssignableLiveClassesHandler,
  listTeacherCoursesHandler,
  listTeacherLiveClassesHandler,
  listTeachersHandler,
  patchTeacherHandler,
  postTeacherHandler,
  putTeacherCoursesHandler,
  putTeacherLiveClassesHandler,
} from '../controllers/teacher.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  assignCoursesSchema,
  assignLiveClassesSchema,
  createTeacherSchema,
  updateTeacherSchema,
} from '../validators/teacher.validators';

export const teacherRouter = Router();

// ---- Canonical flat REST ----
teacherRouter.get('/teachers', requireAuth, requirePermission('teachers:read'), listTeachersHandler);
teacherRouter.post(
  '/teachers',
  requireAuth,
  requirePermission('teachers:create'),
  validate(createTeacherSchema),
  postTeacherHandler,
);
teacherRouter.put(
  '/teachers/:id',
  requireAuth,
  requirePermission('teachers:update'),
  validate(updateTeacherSchema),
  patchTeacherHandler,
);
teacherRouter.delete(
  '/teachers/:id',
  requireAuth,
  requirePermission('teachers:delete'),
  deleteTeacherHandler,
);
teacherRouter.get(
  '/teachers/:id',
  requireAuth,
  requirePermission('teachers:read'),
  getTeacherHandler,
);

// ---- Admin aliases + nested assign APIs ----
teacherRouter.get('/admin/teachers', requireAuth, requirePermission('teachers:read'), listTeachersHandler);
teacherRouter.post(
  '/admin/teachers',
  requireAuth,
  requirePermission('teachers:create'),
  validate(createTeacherSchema),
  postTeacherHandler,
);

teacherRouter.get(
  '/admin/teachers/:teacherId',
  requireAuth,
  requirePermission('teachers:read'),
  getTeacherHandler,
);
teacherRouter.get(
  '/admin/teachers/:teacherId/stats',
  requireAuth,
  requirePermission('teachers:read'),
  getTeacherStatsHandler,
);
teacherRouter.patch(
  '/admin/teachers/:teacherId',
  requireAuth,
  requirePermission('teachers:update'),
  validate(updateTeacherSchema),
  patchTeacherHandler,
);
teacherRouter.put(
  '/admin/teachers/:teacherId',
  requireAuth,
  requirePermission('teachers:update'),
  validate(updateTeacherSchema),
  patchTeacherHandler,
);
teacherRouter.delete(
  '/admin/teachers/:teacherId',
  requireAuth,
  requirePermission('teachers:delete'),
  deleteTeacherHandler,
);

teacherRouter.get(
  '/admin/teachers/:teacherId/courses',
  requireAuth,
  requirePermission('teachers:read'),
  listTeacherCoursesHandler,
);
teacherRouter.get(
  '/admin/teachers/:teacherId/assignable-courses',
  requireAuth,
  requirePermission('teachers:read'),
  listAssignableCoursesHandler,
);
teacherRouter.put(
  '/admin/teachers/:teacherId/courses',
  requireAuth,
  requirePermission('teachers:update'),
  validate(assignCoursesSchema),
  putTeacherCoursesHandler,
);

teacherRouter.get(
  '/admin/teachers/:teacherId/live-classes',
  requireAuth,
  requirePermission('teachers:read'),
  listTeacherLiveClassesHandler,
);
teacherRouter.get(
  '/admin/teachers/:teacherId/assignable-live-classes',
  requireAuth,
  requirePermission('teachers:read'),
  listAssignableLiveClassesHandler,
);
teacherRouter.put(
  '/admin/teachers/:teacherId/live-classes',
  requireAuth,
  requirePermission('teachers:update'),
  validate(assignLiveClassesSchema),
  putTeacherLiveClassesHandler,
);
