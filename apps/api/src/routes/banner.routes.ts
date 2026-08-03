/**
 * Banner routes.
 *
 * Student / app:
 *   GET /banners
 *
 * Admin:
 *   GET    /admin/banners
 *   POST   /admin/banners
 *   POST   /admin/banners/upload-image
 *   PATCH  /admin/banners/:bannerId
 *   DELETE /admin/banners/:bannerId
 */
import { Router } from 'express';

import {
  listAdminBanners,
  listBanners,
  patchBanner,
  postBanner,
  postBannerImage,
  removeBanner,
} from '../controllers/banner.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { bannerImageUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createBannerSchema,
  updateBannerSchema,
} from '../validators/banner.validators';

export const bannerRouter = Router();

bannerRouter.get('/banners', requireAuth, listBanners);

bannerRouter.get('/admin/banners', requireAuth, requirePermission('communications:read'), listAdminBanners);
bannerRouter.post(
  '/admin/banners/upload-image',
  requireAuth,
  requirePermission('communications:create'),
  bannerImageUpload,
  postBannerImage,
);
bannerRouter.post(
  '/admin/banners',
  requireAuth,
  requirePermission('communications:create'),
  validate(createBannerSchema),
  postBanner,
);
bannerRouter.patch(
  '/admin/banners/:bannerId',
  requireAuth,
  requirePermission('communications:update'),
  validate(updateBannerSchema),
  patchBanner,
);
bannerRouter.delete(
  '/admin/banners/:bannerId',
  requireAuth,
  requirePermission('communications:delete'),
  removeBanner,
);
