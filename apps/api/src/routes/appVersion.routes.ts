/**
 * App version routes — public check + admin history/publish.
 */
import { Router } from 'express';
import { z } from 'zod';

import {
  getReleaseNotesHandler,
  getVersionHandler,
  listAppVersionsHandler,
  publishAppVersionHandler,
  publicVersionCheckHandler,
} from '../controllers/appVersion.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';

const semver = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, 'Must be SemVer MAJOR.MINOR.PATCH');

const publishSchema = z.object({
  version: semver,
  release_notes: z.string().max(20_000).optional().default(''),
  android_build_number: z.number().int().min(1).nullable().optional(),
  ios_build_number: z.string().trim().max(40).nullable().optional(),
  force_update: z.boolean().optional().default(false),
  publish_as_current: z.boolean().optional().default(true),
  min_app_version: semver.optional(),
  recommended_app_version: z.union([semver, z.literal('')]).optional(),
  optional_update: z.boolean().optional(),
  store_url_android: z.string().max(500).optional(),
  store_url_ios: z.string().max(500).optional(),
});

export const appVersionRouter = Router();

/** Public ops endpoints (also mounted as /version and /release-notes). */
appVersionRouter.get('/version', getVersionHandler);
appVersionRouter.get('/release-notes', getReleaseNotesHandler);
appVersionRouter.get('/public/version-check', publicVersionCheckHandler);

appVersionRouter.get(
  '/admin/app-versions',
  requireAuth,
  requirePermission('settings:read'),
  listAppVersionsHandler,
);

appVersionRouter.get(
  '/app-versions',
  requireAuth,
  requirePermission('settings:read'),
  listAppVersionsHandler,
);

appVersionRouter.post(
  '/admin/app-versions',
  requireAuth,
  requirePermission('settings:update'),
  validate(publishSchema),
  publishAppVersionHandler,
);

appVersionRouter.post(
  '/app-versions',
  requireAuth,
  requirePermission('settings:update'),
  validate(publishSchema),
  publishAppVersionHandler,
);
