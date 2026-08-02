/**
 * Reminder Engine HTTP — admin manual tick / status.
 */
import type { NextFunction, Request, Response } from 'express';

import { getReminderEngineConfig } from '../jobs/reminderEngine/config';
import { runReminderTick } from '../jobs/reminderEngine/runTick';

/** GET /admin/reminders/status */
export async function getReminderEngineStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    void req;
    res.json({
      success: true,
      data: getReminderEngineConfig(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/reminders/tick
 * Query: dry_run=true — scan only, no claim/send
 */
export async function postReminderEngineTick(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dryRun =
      req.query.dry_run === '1' ||
      req.query.dry_run === 'true' ||
      req.body?.dry_run === true;

    const data = await runReminderTick({ dryRun });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
