/**
 * Module 10 admin ops controllers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  exportActivityLogsCsv,
  getAdminRevenueOverview,
  listAdminActivityLogs,
  listAdminReports,
} from '../services/adminOps.service';
import { exportAdminReport } from '../services/reportExport.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUser(req: Request): { id: string; email: string | null } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return {
    id: req.user.id,
    email: (req.user as { email?: string }).email ?? null,
  };
}

/** GET /admin/revenue/overview */
export async function getAdminRevenueOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const data = await getAdminRevenueOverview();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/reports */
export async function listAdminReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const data = listAdminReports();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/reports/:reportKey/export?format=csv|xlsx|pdf */
export async function exportAdminReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const reportKey = requireParam(req.params.reportKey, 'reportKey');
    const format =
      typeof req.query.format === 'string' ? req.query.format : 'csv';
    const data = await exportAdminReport(reportKey, format);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/activity-logs */
export async function listAdminActivityLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const page = Number(req.query.page ?? 1) || 1;
    const pageSize = Number(req.query.pageSize ?? 25) || 25;
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoryRaw =
      typeof req.query.category === 'string' ? req.query.category : 'all';
    const allowed = new Set(['auth', 'payment', 'profile', 'course', 'admin', 'all']);
    const category = allowed.has(categoryRaw)
      ? (categoryRaw as 'auth' | 'payment' | 'profile' | 'course' | 'admin' | 'all')
      : 'all';
    const data = await listAdminActivityLogs({
      page,
      pageSize,
      action,
      search,
      category,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/activity-logs/export */
export async function exportAdminActivityLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoryRaw =
      typeof req.query.category === 'string' ? req.query.category : 'all';
    const allowed = new Set(['auth', 'payment', 'profile', 'course', 'admin', 'all']);
    const category = allowed.has(categoryRaw)
      ? (categoryRaw as 'auth' | 'payment' | 'profile' | 'course' | 'admin' | 'all')
      : 'all';
    const data = await exportActivityLogsCsv({ action, search, category });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
