/**
 * leaderboard.routes.ts
 *
 *   GET /student/leaderboard?courseId&testId&date&limit
 */
import { Router } from 'express';

import { listLeaderboard } from '../controllers/leaderboard.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { leaderboardQuerySchema } from '../validators/leaderboard.validators';

export const leaderboardRouter = Router();

leaderboardRouter.get(
  '/student/leaderboard',
  requireAuth,
  validate(leaderboardQuerySchema, 'query'),
  listLeaderboard,
);

/** Canonical alias */
leaderboardRouter.get(
  '/leaderboard',
  requireAuth,
  validate(leaderboardQuerySchema, 'query'),
  listLeaderboard,
);
