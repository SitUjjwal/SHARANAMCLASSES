/**
 * Backup controllers — Module 12.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getBackupOverview,
  restoreBackup,
  runBackup,
  updateBackupJob,
} from '../services/backup.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import {
  restoreBackupSchema,
  updateBackupJobSchema,
} from '../validators/backup.validators';

function assertUser(req: Request): { id: string } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return { id: req.user.id };
}

/** GET /admin/backups/overview */
export async function getBackupOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const data = await getBackupOverview();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/backups/run — manual backup */
export async function runBackupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = assertUser(req);
    const data = await runBackup({ trigger: 'manual', actorId: user.id });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/backups/job — schedule / toggles */
export async function updateBackupJobHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const parsed = updateBackupJobSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid backup job payload', parsed.error.flatten());
    }
    const data = await updateBackupJob(parsed.data);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/backups/:runId/restore */
export async function restoreBackupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const runId = requireParam(req.params.runId, 'runId');
    const parsed = restoreBackupSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid restore payload', parsed.error.flatten());
    }
    const data = await restoreBackup({ runId, mode: parsed.data.mode });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
