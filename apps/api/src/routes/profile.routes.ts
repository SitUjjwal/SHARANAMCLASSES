/**
 * Profile routes — authenticated only.
 *
 * GET   /profile  → read own profile
 * PATCH /profile  → update own profile (validated body)
 */
import { Router } from 'express';

import { getProfile, updateProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validators/profile.validators';

export const profileRouter = Router();

profileRouter.get('/profile', requireAuth, getProfile);

profileRouter.patch(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  updateProfile,
);
