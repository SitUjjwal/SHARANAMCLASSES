/**
 * Bug report routes.
 *
 * Student:
 *   POST /bug-reports | /bug-report   multipart (description, screen_key, screenshot?)
 *   GET  /bug-reports
 *   GET  /bug-reports/:reportId
 *
 * Admin:
 *   GET   /admin/bug-reports?status=
 *   PATCH /admin/bug-reports/:reportId
 */
import { Router } from 'express';

import {
  getMyBugReportHandler,
  listAdminBugReportsHandler,
  listMyBugReportsHandler,
  patchAdminBugReport,
  postCreateBugReport,
} from '../controllers/bugReport.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { bugScreenshotUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  adminBugReportsQuerySchema,
  createBugReportSchema,
  updateBugReportStatusSchema,
} from '../validators/bugReport.validators';

export const bugReportRouter = Router();

bugReportRouter.post(
  '/bug-reports',
  requireAuth,
  bugScreenshotUpload,
  validate(createBugReportSchema),
  postCreateBugReport,
);
/** Spec alias */
bugReportRouter.post(
  '/bug-report',
  requireAuth,
  bugScreenshotUpload,
  validate(createBugReportSchema),
  postCreateBugReport,
);

bugReportRouter.get('/bug-reports', requireAuth, listMyBugReportsHandler);
bugReportRouter.get('/bug-reports/:reportId', requireAuth, getMyBugReportHandler);

bugReportRouter.get(
  '/admin/bug-reports',
  requireAuth,
  requirePermission('feedback:read'),
  validate(adminBugReportsQuerySchema, 'query'),
  listAdminBugReportsHandler,
);
bugReportRouter.patch(
  '/admin/bug-reports/:reportId',
  requireAuth,
  requirePermission('feedback:update'),
  validate(updateBugReportStatusSchema),
  patchAdminBugReport,
);
