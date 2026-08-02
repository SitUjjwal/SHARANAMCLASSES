/**
 * Admin Feedback Dashboard routes.
 *
 *   GET /admin/feedback-dashboard/stats
 *   GET /admin/feedback-dashboard?category=&status=&search=&page=&pageSize=
 *   GET /admin/feedback-dashboard/export?category=&status=&search=
 */
import { Router } from 'express';

import {
  exportFeedbackDashboardHandler,
  getFeedbackDashboardStatsHandler,
  listFeedbackDashboardHandler,
} from '../controllers/feedbackDashboard.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  feedbackDashboardExportQuerySchema,
  feedbackDashboardListQuerySchema,
} from '../validators/feedbackDashboard.validators';

export const feedbackDashboardRouter = Router();

feedbackDashboardRouter.get(
  '/admin/feedback-dashboard/stats',
  requireAuth,
  requireAdmin,
  getFeedbackDashboardStatsHandler,
);

feedbackDashboardRouter.get(
  '/admin/feedback-dashboard/export',
  requireAuth,
  requireAdmin,
  validate(feedbackDashboardExportQuerySchema, 'query'),
  exportFeedbackDashboardHandler,
);

feedbackDashboardRouter.get(
  '/admin/feedback-dashboard',
  requireAuth,
  requireAdmin,
  validate(feedbackDashboardListQuerySchema, 'query'),
  listFeedbackDashboardHandler,
);
