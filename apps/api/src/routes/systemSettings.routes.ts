/**
 * System settings routes.
 *
 * Canonical:
 *   GET|PUT /settings
 *   GET /public/platform
 *
 * Also: /admin/settings… + logo upload
 */
import { Router } from 'express';

import {
  getAdminSettingsHandler,
  getPublicPlatformHandler,
  updateAdminSettingsHandler,
  uploadAdminLogoHandler,
} from '../controllers/systemSettings.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { logoUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { updateSystemSettingsSchema } from '../validators/systemSettings.validators';

export const systemSettingsRouter = Router();

systemSettingsRouter.get('/public/platform', getPublicPlatformHandler);

systemSettingsRouter.get(
  '/settings',
  requireAuth,
  requirePermission('settings:read'),
  getAdminSettingsHandler,
);

systemSettingsRouter.put(
  '/settings',
  requireAuth,
  requirePermission('settings:update'),
  validate(updateSystemSettingsSchema),
  updateAdminSettingsHandler,
);

systemSettingsRouter.get(
  '/admin/settings',
  requireAuth,
  requirePermission('settings:read'),
  getAdminSettingsHandler,
);

systemSettingsRouter.put(
  '/admin/settings',
  requireAuth,
  requirePermission('settings:update'),
  validate(updateSystemSettingsSchema),
  updateAdminSettingsHandler,
);

systemSettingsRouter.post(
  '/admin/settings/logo',
  requireAuth,
  requirePermission('settings:update'),
  logoUpload,
  uploadAdminLogoHandler,
);

systemSettingsRouter.post(
  '/settings/logo',
  requireAuth,
  requirePermission('settings:update'),
  logoUpload,
  uploadAdminLogoHandler,
);
