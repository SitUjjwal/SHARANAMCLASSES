/**
 * Admin insights routes.
 *
 *   GET /admin/results
 *   GET /admin/analytics
 */
import { Router } from 'express';

import {
  getAdminAnalyticsHandler,
  listAdminResultsHandler,
} from '../controllers/adminInsights.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';

export const adminInsightsRouter = Router();

adminInsightsRouter.get(
  '/admin/results',
  requireAuth,
  requireAdmin,
  listAdminResultsHandler,
);

adminInsightsRouter.get(
  '/admin/analytics',
  requireAuth,
  requireAdmin,
  getAdminAnalyticsHandler,
);
