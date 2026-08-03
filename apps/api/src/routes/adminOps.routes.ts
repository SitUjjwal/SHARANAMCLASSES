/**
 * Module 10 admin ops routes (revenue, reports, activity).
 *
 * Canonical:
 *   GET /reports
 *   GET /activity-logs
 *
 * Also: /admin/… aliases + export endpoints
 */
import { Router } from 'express';

import {
  exportAdminActivityLogsHandler,
  exportAdminReportHandler,
  getAdminRevenueOverviewHandler,
  listAdminActivityLogsHandler,
  listAdminReportsHandler,
} from '../controllers/adminOps.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const adminOpsRouter = Router();

adminOpsRouter.get(
  '/reports',
  requireAuth,
  requirePermission('reports:read'),
  listAdminReportsHandler,
);

adminOpsRouter.get(
  '/activity-logs',
  requireAuth,
  requirePermission('settings:read'),
  listAdminActivityLogsHandler,
);

adminOpsRouter.get(
  '/admin/revenue/overview',
  requireAuth,
  requirePermission('payments:read'),
  getAdminRevenueOverviewHandler,
);

adminOpsRouter.get(
  '/admin/reports',
  requireAuth,
  requirePermission('reports:read'),
  listAdminReportsHandler,
);

adminOpsRouter.get(
  '/admin/reports/:reportKey/export',
  requireAuth,
  requirePermission('reports:create'),
  exportAdminReportHandler,
);

adminOpsRouter.get(
  '/reports/:reportKey/export',
  requireAuth,
  requirePermission('reports:create'),
  exportAdminReportHandler,
);

adminOpsRouter.get(
  '/admin/activity-logs',
  requireAuth,
  requirePermission('settings:read'),
  listAdminActivityLogsHandler,
);

adminOpsRouter.get(
  '/admin/activity-logs/export',
  requireAuth,
  requirePermission('reports:create'),
  exportAdminActivityLogsHandler,
);

adminOpsRouter.get(
  '/activity-logs/export',
  requireAuth,
  requirePermission('reports:create'),
  exportAdminActivityLogsHandler,
);
