/**
 * Announcement routes.
 *
 * Student:
 *   GET /announcements
 *
 * Admin:
 *   GET    /admin/announcements
 *   POST   /admin/announcements
 *   POST   /admin/announcements/upload-image
 *   PATCH  /admin/announcements/:announcementId
 *   DELETE /admin/announcements/:announcementId
 */
import { Router } from 'express';

import {
  listAdminAnnouncements,
  listAnnouncements,
  patchAnnouncement,
  postAnnouncement,
  postAnnouncementImage,
  removeAnnouncement,
} from '../controllers/announcement.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { bannerImageUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validators/announcement.validators';

export const announcementRouter = Router();

announcementRouter.get('/announcements', requireAuth, listAnnouncements);

announcementRouter.get(
  '/admin/announcements',
  requireAuth,
  requireAdmin,
  listAdminAnnouncements,
);
announcementRouter.post(
  '/admin/announcements/upload-image',
  requireAuth,
  requireAdmin,
  bannerImageUpload,
  postAnnouncementImage,
);
announcementRouter.post(
  '/admin/announcements',
  requireAuth,
  requireAdmin,
  validate(createAnnouncementSchema),
  postAnnouncement,
);
announcementRouter.patch(
  '/admin/announcements/:announcementId',
  requireAuth,
  requireAdmin,
  validate(updateAnnouncementSchema),
  patchAnnouncement,
);
announcementRouter.delete(
  '/admin/announcements/:announcementId',
  requireAuth,
  requireAdmin,
  removeAnnouncement,
);
