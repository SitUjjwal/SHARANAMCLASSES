/**
 * Content report HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createContentReport,
  getMyContentReport,
  listAdminContentReports,
  listMyContentReports,
  updateContentReportStatus,
} from '../services/contentReport.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  CreateContentReportBody,
  UpdateContentReportStatusBody,
} from '../validators/contentReport.validators';
import type { ContentReportStatus, ContentReportType } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** POST /content-reports */
export async function postCreateContentReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as CreateContentReportBody;
    const data = await createContentReport(userId, body);
    res.status(201).json({
      success: true,
      data,
      message: 'Content report submitted',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /content-reports */
export async function listMyContentReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await listMyContentReports(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /content-reports/:reportId */
export async function getMyContentReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const reportId = requireParam(req.params.reportId, 'reportId');
    const data = await getMyContentReport(userId, reportId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/content-reports */
export async function listAdminContentReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as {
      status?: ContentReportStatus;
      report_type?: ContentReportType;
    };
    const data = await listAdminContentReports({
      status: q.status,
      report_type: q.report_type,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/content-reports/:reportId */
export async function patchAdminContentReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const reportId = requireParam(req.params.reportId, 'reportId');
    const body = req.body as UpdateContentReportStatusBody;
    const data = await updateContentReportStatus(reportId, body, adminId);
    res.status(200).json({ success: true, data, message: 'Report updated' });
  } catch (error) {
    next(error);
  }
}
