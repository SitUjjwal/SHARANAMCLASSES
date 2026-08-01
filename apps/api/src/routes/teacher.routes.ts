/**
 * Teacher routes (admin).
 * GET    /admin/teachers
 * POST   /admin/teachers
 * PATCH  /admin/teachers/:teacherId
 * DELETE /admin/teachers/:teacherId
 */
import { Router } from 'express';

import {
  deleteTeacherHandler,
  listTeachersHandler,
  patchTeacherHandler,
  postTeacherHandler,
} from '../controllers/teacher.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  createTeacherSchema,
  updateTeacherSchema,
} from '../validators/teacher.validators';

export const teacherRouter = Router();

teacherRouter.get('/admin/teachers', requireAuth, requireAdmin, listTeachersHandler);
teacherRouter.post(
  '/admin/teachers',
  requireAuth,
  requireAdmin,
  validate(createTeacherSchema),
  postTeacherHandler,
);
teacherRouter.patch(
  '/admin/teachers/:teacherId',
  requireAuth,
  requireAdmin,
  validate(updateTeacherSchema),
  patchTeacherHandler,
);
teacherRouter.delete(
  '/admin/teachers/:teacherId',
  requireAuth,
  requireAdmin,
  deleteTeacherHandler,
);
