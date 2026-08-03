/**
 * Content report routes.
 *
 * Student:
 *   POST /content-reports
 *   GET  /content-reports
 *   GET  /content-reports/:reportId
 *
 * Admin:
 *   GET   /admin/content-reports?status=&report_type=
 *   PATCH /admin/content-reports/:reportId
 */
import { Router } from 'express';

import {
  getMyContentReportHandler,
  listAdminContentReportsHandler,
  listMyContentReportsHandler,
  patchAdminContentReport,
  postCreateContentReport,
} from '../controllers/contentReport.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  adminContentReportsQuerySchema,
  createContentReportSchema,
  updateContentReportStatusSchema,
} from '../validators/contentReport.validators';

export const contentReportRouter = Router();

contentReportRouter.post(
  '/content-reports',
  requireAuth,
  validate(createContentReportSchema),
  postCreateContentReport,
);
/** Spec alias */
contentReportRouter.post(
  '/report-content',
  requireAuth,
  validate(createContentReportSchema),
  postCreateContentReport,
);
contentReportRouter.get('/content-reports', requireAuth, listMyContentReportsHandler);
contentReportRouter.get(
  '/content-reports/:reportId',
  requireAuth,
  getMyContentReportHandler,
);

contentReportRouter.get(
  '/admin/content-reports',
  requireAuth,
  requirePermission('feedback:read'),
  validate(adminContentReportsQuerySchema, 'query'),
  listAdminContentReportsHandler,
);
contentReportRouter.patch(
  '/admin/content-reports/:reportId',
  requireAuth,
  requirePermission('feedback:update'),
  validate(updateContentReportStatusSchema),
  patchAdminContentReport,
);
