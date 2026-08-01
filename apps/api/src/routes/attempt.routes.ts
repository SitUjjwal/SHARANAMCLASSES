/**
 * attempt.routes.ts — student attempts + canonical submit/results aliases.
 *
 * Verbose:
 *   POST /student/tests/:testId/attempts
 *   GET  /student/attempts/:attemptId
 *   PUT  /student/attempts/:attemptId/answers
 *   POST /student/attempts/:attemptId/pause-credit
 *   POST /student/attempts/:attemptId/submit
 *   GET  /student/attempts/:attemptId/result
 *
 * Canonical (requested API surface):
 *   POST /submit-test
 *   GET  /results
 *   GET  /results/:id
 */
import { Router } from 'express';

import {
  getAttempt,
  getResult,
  listResults,
  postPauseCredit,
  postStartAttempt,
  postSubmitAttempt,
  postSubmitTest,
  putAttemptAnswers,
} from '../controllers/attempt.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  listResultsQuerySchema,
  pauseCreditSchema,
  saveAttemptAnswersSchema,
  submitTestBodySchema,
} from '../validators/attempt.validators';

export const attemptRouter = Router();

attemptRouter.post(
  '/student/tests/:testId/attempts',
  requireAuth,
  postStartAttempt,
);

attemptRouter.get('/student/attempts/:attemptId', requireAuth, getAttempt);

attemptRouter.put(
  '/student/attempts/:attemptId/answers',
  requireAuth,
  validate(saveAttemptAnswersSchema),
  putAttemptAnswers,
);

attemptRouter.post(
  '/student/attempts/:attemptId/pause-credit',
  requireAuth,
  validate(pauseCreditSchema),
  postPauseCredit,
);

attemptRouter.post(
  '/student/attempts/:attemptId/submit',
  requireAuth,
  postSubmitAttempt,
);

attemptRouter.get(
  '/student/attempts/:attemptId/result',
  requireAuth,
  getResult,
);

/** Canonical aliases */
attemptRouter.post(
  '/submit-test',
  requireAuth,
  validate(submitTestBodySchema),
  postSubmitTest,
);

attemptRouter.get(
  '/results',
  requireAuth,
  validate(listResultsQuerySchema, 'query'),
  listResults,
);

attemptRouter.get('/results/:id', requireAuth, getResult);
