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
import { requireAdmin } from '../middlewares/requireAdmin';
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
  requireAdmin,
  validate(listQuestionsPathQuerySchema, 'query'),
  listQuestions,
);

questionRouter.post(
  '/tests/:testId/questions/import',
  requireAuth,
  requireAdmin,
  excelUpload,
  postQuestionsImport,
);

questionRouter.post(
  '/tests/:testId/questions',
  requireAuth,
  requireAdmin,
  validate(createQuestionBodySchema),
  postQuestion,
);

questionRouter.get('/questions/:id', requireAuth, requireAdmin, getQuestion);

questionRouter.put(
  '/questions/:id',
  requireAuth,
  requireAdmin,
  validate(updateQuestionSchema),
  putQuestion,
);

questionRouter.delete('/questions/:id', requireAuth, requireAdmin, removeQuestion);

questionRouter.get(
  '/student/tests/:testId/questions',
  requireAuth,
  listStudentQuestions,
);
