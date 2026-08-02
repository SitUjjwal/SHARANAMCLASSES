/**
 * Profile routes — authenticated only.
 *
 * Canonical (Module 8):
 *   GET  /profile
 *   PUT  /profile
 *   POST /profile/upload-photo
 *
 * Also kept:
 *   GET   /profile/overview
 *   POST  /profile/avatar   (alias of upload-photo)
 *   PATCH /profile          (alias of PUT)
 */
import { Router } from 'express';

import {
  getOverview,
  getProfile,
  updateProfile,
  uploadAvatar,
} from '../controllers/profile.controller';
import { requireAuth } from '../middlewares/auth';
import { profileAvatarUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validators/profile.validators';

export const profileRouter = Router();

profileRouter.get('/profile/overview', requireAuth, getOverview);
profileRouter.get('/profile', requireAuth, getProfile);

profileRouter.post(
  '/profile/upload-photo',
  requireAuth,
  profileAvatarUpload,
  uploadAvatar,
);
profileRouter.post(
  '/profile/avatar',
  requireAuth,
  profileAvatarUpload,
  uploadAvatar,
);

profileRouter.put(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  updateProfile,
);
profileRouter.patch(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  updateProfile,
);
