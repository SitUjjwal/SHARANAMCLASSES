/**
 * Admin Feedback Dashboard controllers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  exportFeedbackDashboardCsv,
  getFeedbackDashboardStats,
  listFeedbackDashboardItems,
} from '../services/feedbackDashboard.service';
import type {
  FeedbackDashboardExportQueryInput,
  FeedbackDashboardListQueryInput,
} from '../validators/feedbackDashboard.validators';

/** GET /admin/feedback-dashboard/stats */
export async function getFeedbackDashboardStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getFeedbackDashboardStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /admin/feedback-dashboard */
export async function listFeedbackDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as FeedbackDashboardListQueryInput;
    const data = await listFeedbackDashboardItems({
      category: query.category,
      status: query.status,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /admin/feedback-dashboard/export */
export async function exportFeedbackDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as FeedbackDashboardExportQueryInput;
    const data = await exportFeedbackDashboardCsv({
      category: query.category,
      status: query.status,
      search: query.search,
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
