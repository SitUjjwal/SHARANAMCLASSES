/**
 * Ops API — production-friendly short paths.
 *
 *   GET  /metrics
 *   GET  /logs
 *   POST /backup
 *   POST /restore
 *   GET  /system-status
 *
 * (GET /health lives in health.routes.ts)
 */
import { Router } from 'express';

import {
  getLogsHandler,
  getMetricsHandler,
  getSystemStatusHandler,
  postBackupHandler,
  postRestoreHandler,
} from '../controllers/systemOps.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const systemOpsRouter = Router();

systemOpsRouter.get(
  '/metrics',
  requireAuth,
  requirePermission('settings:read'),
  getMetricsHandler,
);

systemOpsRouter.get(
  '/logs',
  requireAuth,
  requirePermission('settings:read'),
  getLogsHandler,
);

systemOpsRouter.post(
  '/backup',
  requireAuth,
  requirePermission('settings:update'),
  postBackupHandler,
);

systemOpsRouter.post(
  '/restore',
  requireAuth,
  requirePermission('settings:update'),
  postRestoreHandler,
);

systemOpsRouter.get(
  '/system-status',
  requireAuth,
  requirePermission('settings:read'),
  getSystemStatusHandler,
);
