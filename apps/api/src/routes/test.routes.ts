/**
 * test.routes.ts — Test Series Management.
 *
 * Admin:
 *   GET|POST          /tests
 *   GET|PUT|DELETE    /tests/:id
 *
 * Student:
 *   GET               /student/tests
 */
import { Router } from 'express';

import {
  getTest,
  listStudentTests,
  listTests,
  postTest,
  putTest,
  removeTest,
} from '../controllers/test.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  createTestSchema,
  listTestsQuerySchema,
  updateTestSchema,
} from '../validators/test.validators';

export const testRouter = Router();

testRouter.get(
  '/tests',
  requireAuth,
  requirePermission('tests:read'),
  validate(listTestsQuerySchema, 'query'),
  listTests,
);

testRouter.post('/tests', requireAuth, requirePermission('tests:create'), validate(createTestSchema), postTest);

testRouter.get('/tests/:id', requireAuth, requirePermission('tests:read'), getTest);

testRouter.put(
  '/tests/:id',
  requireAuth,
  requirePermission('tests:update'),
  validate(updateTestSchema),
  putTest,
);

testRouter.delete('/tests/:id', requireAuth, requirePermission('tests:delete'), removeTest);

testRouter.get('/student/tests', requireAuth, listStudentTests);
