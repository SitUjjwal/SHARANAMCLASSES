/**
 * Admin student management routes.
 *
 * Canonical: GET /students
 * Also: /admin/students… (detail, suspend, export, …)
 */
import { Router } from 'express';

import {
  activateStudentHandler,
  exportStudentsHandler,
  getStudentHandler,
  listStudentCoursesHandler,
  listStudentPaymentsHandler,
  listStudentsHandler,
  listStudentTestsHandler,
  patchStudentHandler,
  resetStudentPasswordHandler,
  suspendStudentHandler,
} from '../controllers/studentAdmin.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  listStudentsQuerySchema,
  resetStudentPasswordSchema,
  suspendStudentSchema,
  updateStudentSchema,
} from '../validators/studentAdmin.validators';

export const studentAdminRouter = Router();

studentAdminRouter.get(
  '/students',
  requireAuth,
  requirePermission('students:read'),
  validate(listStudentsQuerySchema, 'query'),
  listStudentsHandler,
);

studentAdminRouter.get(
  '/admin/students',
  requireAuth,
  requirePermission('students:read'),
  validate(listStudentsQuerySchema, 'query'),
  listStudentsHandler,
);

studentAdminRouter.get(
  '/admin/students/export',
  requireAuth,
  requirePermission('students:read'),
  validate(listStudentsQuerySchema, 'query'),
  exportStudentsHandler,
);

studentAdminRouter.get(
  '/admin/students/:studentId',
  requireAuth,
  requirePermission('students:read'),
  getStudentHandler,
);

studentAdminRouter.patch(
  '/admin/students/:studentId',
  requireAuth,
  requirePermission('students:update'),
  validate(updateStudentSchema),
  patchStudentHandler,
);

studentAdminRouter.post(
  '/admin/students/:studentId/suspend',
  requireAuth,
  requirePermission('students:update'),
  validate(suspendStudentSchema),
  suspendStudentHandler,
);

studentAdminRouter.post(
  '/admin/students/:studentId/activate',
  requireAuth,
  requirePermission('students:update'),
  activateStudentHandler,
);

studentAdminRouter.post(
  '/admin/students/:studentId/reset-password',
  requireAuth,
  requirePermission('students:update'),
  validate(resetStudentPasswordSchema),
  resetStudentPasswordHandler,
);

studentAdminRouter.get(
  '/admin/students/:studentId/courses',
  requireAuth,
  requirePermission('students:read'),
  listStudentCoursesHandler,
);

studentAdminRouter.get(
  '/admin/students/:studentId/tests',
  requireAuth,
  requirePermission('students:read'),
  listStudentTestsHandler,
);

studentAdminRouter.get(
  '/admin/students/:studentId/payments',
  requireAuth,
  requirePermission('students:read'),
  listStudentPaymentsHandler,
);
