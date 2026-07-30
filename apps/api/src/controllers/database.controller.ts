import type { NextFunction, Request, Response } from 'express';

import { checkDatabaseStatus } from '../services/database.service';

export async function getDatabaseStatus(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await checkDatabaseStatus();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
