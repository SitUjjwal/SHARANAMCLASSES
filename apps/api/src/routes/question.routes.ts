/**
 * question.routes.ts — Question Management.
 *
 * Admin:
 *   GET|POST  /tests/:testId/questions
 *   POST      /tests/:testId/questions/import
 *   GET|PUT|DELETE /questions/:id
 *
 * Student:
 *   GET /student/tests/:testId/questions
 */
import { Router } from 'express';

import {
  getQuestion,
  listQuestions,
  listStudentQuestions,
  postQuestion,
  postQuestionsImport,
  putQuestion,
  removeQuestion,
} from '../controllers/question.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { excelUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createQuestionBodySchema,
  listQuestionsPathQuerySchema,
  updateQuestionSchema,
} from '../validators/question.validators';

export const questionRouter = Router();

questionRouter.get(
  '/tests/:testId/questions',
  requireAuth,
  requirePermission('tests:read'),
  validate(listQuestionsPathQuerySchema, 'query'),
  listQuestions,
);

questionRouter.post(
  '/tests/:testId/questions/import',
  requireAuth,
  requirePermission('tests:create'),
  excelUpload,
  postQuestionsImport,
);

questionRouter.post(
  '/tests/:testId/questions',
  requireAuth,
  requirePermission('tests:create'),
  validate(createQuestionBodySchema),
  postQuestion,
);

questionRouter.get('/questions/:id', requireAuth, requirePermission('tests:read'), getQuestion);

questionRouter.put(
  '/questions/:id',
  requireAuth,
  requirePermission('tests:update'),
  validate(updateQuestionSchema),
  putQuestion,
);

questionRouter.delete('/questions/:id', requireAuth, requirePermission('tests:delete'), removeQuestion);

questionRouter.get(
  '/student/tests/:testId/questions',
  requireAuth,
  listStudentQuestions,
);
