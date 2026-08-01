/**
 * leaderboard.controller.ts — Top 100 leaderboard HTTP adapter.
 */
import type { NextFunction, Request, Response } from 'express';

import { getLeaderboard } from '../services/leaderboard.service';
import type { LeaderboardQuery } from '../validators/leaderboard.validators';

/** GET /student/leaderboard */
export async function listLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as LeaderboardQuery;
    const data = await getLeaderboard(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
