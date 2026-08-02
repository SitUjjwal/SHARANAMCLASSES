/**
 * Bug report HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createBugReport,
  getMyBugReport,
  listAdminBugReports,
  listMyBugReports,
  updateBugReportStatus,
} from '../services/bugReport.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  CreateBugReportInput,
  UpdateBugReportStatusBody,
} from '../validators/bugReport.validators';
import type { BugReportStatus } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** POST /bug-reports (multipart: description, screen_key, optional screenshot) */
export async function postCreateBugReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as CreateBugReportInput;
    const file = req.file;
    const data = await createBugReport(userId, body, file);
    res.status(201).json({
      success: true,
      data,
      message: 'Bug report submitted',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /bug-reports */
export async function listMyBugReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await listMyBugReports(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /bug-reports/:reportId */
export async function getMyBugReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const reportId = requireParam(req.params.reportId, 'reportId');
    const data = await getMyBugReport(userId, reportId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/bug-reports */
export async function listAdminBugReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as { status?: BugReportStatus };
    const data = await listAdminBugReports({ status: q.status });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/bug-reports/:reportId */
export async function patchAdminBugReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const reportId = requireParam(req.params.reportId, 'reportId');
    const body = req.body as UpdateBugReportStatusBody;
    const data = await updateBugReportStatus(reportId, body, adminId);
    res.status(200).json({ success: true, data, message: 'Bug report updated' });
  } catch (error) {
    next(error);
  }
}
