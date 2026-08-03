/**
 * test.routes.ts — Test Series Management (Zod on query / body / params).
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
import { validate, validateRequest } from '../middlewares/validate';
import { uuidIdParamSchema } from '../validators/common.validators';
import {
  createTestSchema,
  listStudentTestsQuerySchema,
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

testRouter.post(
  '/tests',
  requireAuth,
  requirePermission('tests:create'),
  validate(createTestSchema),
  postTest,
);

testRouter.get(
  '/tests/:id',
  requireAuth,
  requirePermission('tests:read'),
  validate(uuidIdParamSchema, 'params'),
  getTest,
);

testRouter.put(
  '/tests/:id',
  requireAuth,
  requirePermission('tests:update'),
  validateRequest({
    params: uuidIdParamSchema,
    body: updateTestSchema,
  }),
  putTest,
);

testRouter.delete(
  '/tests/:id',
  requireAuth,
  requirePermission('tests:delete'),
  validate(uuidIdParamSchema, 'params'),
  removeTest,
);

testRouter.get(
  '/student/tests',
  requireAuth,
  validate(listStudentTestsQuerySchema, 'query'),
  listStudentTests,
);
