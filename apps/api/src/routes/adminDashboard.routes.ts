/**
 * Admin dashboard routes.
 *   GET /admin/dashboard/overview
 */
import { Router } from 'express';

import { getAdminDashboardOverviewHandler } from '../controllers/adminDashboard.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  '/admin/dashboard/overview',
  requireAuth,
  requirePermission('dashboard:read'),
  getAdminDashboardOverviewHandler,
);
