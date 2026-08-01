/**
 * attempt.controller.ts — student test attempt HTTP adapters.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  creditAttemptPause,
  getAttemptResult,
  getAttemptSession,
  listStudentResults,
  saveAttemptAnswers,
  startOrResumeAttempt,
  submitAttempt,
} from '../services/attempt.service';
import type {
  ListResultsQuery,
  PauseCreditInput,
  SaveAttemptAnswersInput,
  SubmitTestBody,
} from '../validators/attempt.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return userId;
}

/** POST /student/tests/:testId/attempts */
export async function postStartAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const testId = requireParam(req.params.testId, 'testId');
    const data = await startOrResumeAttempt(userId, testId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /student/attempts/:attemptId */
export async function getAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const attemptId = requireParam(req.params.attemptId, 'attemptId');
    const data = await getAttemptSession(userId, attemptId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PUT /student/attempts/:attemptId/answers */
export async function putAttemptAnswers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const attemptId = requireParam(req.params.attemptId, 'attemptId');
    const body = req.body as SaveAttemptAnswersInput;
    const data = await saveAttemptAnswers(userId, attemptId, body);
    res.status(200).json({ success: true, data, message: 'Answers saved' });
  } catch (error) {
    next(error);
  }
}

/** POST /student/attempts/:attemptId/pause-credit */
export async function postPauseCredit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const attemptId = requireParam(req.params.attemptId, 'attemptId');
    const body = req.body as PauseCreditInput;
    const data = await creditAttemptPause(userId, attemptId, body.paused_ms);
    res.status(200).json({ success: true, data, message: 'Timer extended' });
  } catch (error) {
    next(error);
  }
}

/** POST /student/attempts/:attemptId/submit */
export async function postSubmitAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const attemptId = requireParam(req.params.attemptId, 'attemptId');
    const reason =
      req.body?.reason === 'auto' ? ('auto' as const) : ('manual' as const);
    const data = await submitAttempt(userId, attemptId, reason);
    res.status(200).json({ success: true, data, message: 'Attempt submitted' });
  } catch (error) {
    next(error);
  }
}

/** Canonical POST /submit-test { attempt_id, reason? } */
export async function postSubmitTest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as SubmitTestBody;
    const data = await submitAttempt(userId, body.attempt_id, body.reason);
    res.status(200).json({ success: true, data, message: 'Attempt submitted' });
  } catch (error) {
    next(error);
  }
}

/** GET /student/attempts/:attemptId/result · GET /results/:id */
export async function getResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const raw = req.params.attemptId ?? req.params.id;
    const attemptId = requireParam(raw, 'attemptId');
    const data = await getAttemptResult(userId, attemptId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** Canonical GET /results — list */
export async function listResults(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const query = req.query as unknown as ListResultsQuery;
    const data = await listStudentResults(userId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
