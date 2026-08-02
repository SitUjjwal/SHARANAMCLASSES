/**
 * Admin student management routes.
 *
 *   GET   /admin/students
 *   GET   /admin/students/:studentId
 *   PATCH /admin/students/:studentId
 */
import { Router } from 'express';

import {
  getStudentHandler,
  listStudentsHandler,
  patchStudentHandler,
} from '../controllers/studentAdmin.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  listStudentsQuerySchema,
  updateStudentSchema,
} from '../validators/studentAdmin.validators';

export const studentAdminRouter = Router();

studentAdminRouter.get(
  '/admin/students',
  requireAuth,
  requireAdmin,
  validate(listStudentsQuerySchema, 'query'),
  listStudentsHandler,
);

studentAdminRouter.get(
  '/admin/students/:studentId',
  requireAuth,
  requireAdmin,
  getStudentHandler,
);

studentAdminRouter.patch(
  '/admin/students/:studentId',
  requireAuth,
  requireAdmin,
  validate(updateStudentSchema),
  patchStudentHandler,
);
