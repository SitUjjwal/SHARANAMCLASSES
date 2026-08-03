/**
 * Admin insights HTTP adapters — results + platform analytics.
 */
import type { NextFunction, Request, Response } from 'express';

import { getAdminTestAnalytics } from '../services/adminAnalytics.service';
import { getAdminAnalyticsOverview } from '../services/analyticsOverview.service';
import { listAdminResults } from '../services/adminResults.service';

/** GET /admin/results */
export async function listAdminResultsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const data = await listAdminResults({ page, pageSize });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/analytics */
export async function getAdminAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminTestAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/analytics/overview */
export async function getAdminAnalyticsOverviewHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminAnalyticsOverview();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
