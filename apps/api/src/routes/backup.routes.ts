/**
 * Module 12 Backup routes.
 *
 *   GET   /admin/backups/overview
 *   POST  /admin/backups/run
 *   PATCH /admin/backups/job
 *   POST  /admin/backups/:runId/restore
 */
import { Router } from 'express';

import {
  getBackupOverviewHandler,
  restoreBackupHandler,
  runBackupHandler,
  updateBackupJobHandler,
} from '../controllers/backup.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const backupRouter = Router();

backupRouter.get(
  '/admin/backups/overview',
  requireAuth,
  requirePermission('settings:read'),
  getBackupOverviewHandler,
);

backupRouter.post(
  '/admin/backups/run',
  requireAuth,
  requirePermission('settings:update'),
  runBackupHandler,
);

backupRouter.patch(
  '/admin/backups/job',
  requireAuth,
  requirePermission('settings:update'),
  updateBackupJobHandler,
);

backupRouter.post(
  '/admin/backups/:runId/restore',
  requireAuth,
  requirePermission('settings:update'),
  restoreBackupHandler,
);
