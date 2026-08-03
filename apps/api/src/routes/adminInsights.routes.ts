/**
 * Admin insights routes.
 *
 * Canonical: GET /analytics
 * Also: /admin/analytics, /admin/analytics/overview, /admin/results
 */
import { Router } from 'express';

import {
  getAdminAnalyticsHandler,
  getAdminAnalyticsOverviewHandler,
  listAdminResultsHandler,
} from '../controllers/adminInsights.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const adminInsightsRouter = Router();

adminInsightsRouter.get(
  '/analytics',
  requireAuth,
  requirePermission('analytics:read'),
  getAdminAnalyticsOverviewHandler,
);

adminInsightsRouter.get(
  '/admin/results',
  requireAuth,
  requirePermission('analytics:read'),
  listAdminResultsHandler,
);

adminInsightsRouter.get(
  '/admin/analytics/overview',
  requireAuth,
  requirePermission('analytics:read'),
  getAdminAnalyticsOverviewHandler,
);

adminInsightsRouter.get(
  '/admin/analytics',
  requireAuth,
  requirePermission('analytics:read'),
  getAdminAnalyticsHandler,
);
