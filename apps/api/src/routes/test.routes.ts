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
import { requireAdmin } from '../middlewares/requireAdmin';
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
  requireAdmin,
  validate(listTestsQuerySchema, 'query'),
  listTests,
);

testRouter.post('/tests', requireAuth, requireAdmin, validate(createTestSchema), postTest);

testRouter.get('/tests/:id', requireAuth, requireAdmin, getTest);

testRouter.put(
  '/tests/:id',
  requireAuth,
  requireAdmin,
  validate(updateTestSchema),
  putTest,
);

testRouter.delete('/tests/:id', requireAuth, requireAdmin, removeTest);

testRouter.get('/student/tests', requireAuth, listStudentTests);
