/**
 * Module 11 Monitoring routes.
 *
 *   GET /admin/monitoring/overview
 *   GET /monitoring/overview  (alias)
 *   GET /alerts
 *   POST /alerts/:id/ack
 */
import { Router } from 'express';

import {
  acknowledgeAlertHandler,
  getAlertsHandler,
  getMonitoringOverviewHandler,
} from '../controllers/monitoring.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const monitoringRouter = Router();

monitoringRouter.get(
  '/admin/monitoring/overview',
  requireAuth,
  requirePermission('settings:read'),
  getMonitoringOverviewHandler,
);

monitoringRouter.get(
  '/monitoring/overview',
  requireAuth,
  requirePermission('settings:read'),
  getMonitoringOverviewHandler,
);

monitoringRouter.get(
  '/alerts',
  requireAuth,
  requirePermission('settings:read'),
  getAlertsHandler,
);

monitoringRouter.post(
  '/alerts/:id/ack',
  requireAuth,
  requirePermission('settings:update'),
  acknowledgeAlertHandler,
);
