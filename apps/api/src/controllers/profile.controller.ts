/**
 * Profile controller — HTTP layer only.
 *
 * Responsibilities:
 * - Read `req.user` (set by requireAuth)
 * - Call profile services
 * - Shape JSON responses
 * - Forward errors to errorHandler via next(error)
 *
 * Does NOT contain SQL / Supabase calls (those live in services).
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getProfileByUserId,
  updateProfileByUserId,
} from '../services/profile.service';
import type { UpdateProfileInput } from '../validators/profile.validators';
import { AppError } from '../utils/AppError';

/**
 * assertAuthenticatedUser
 * Guards controllers against missing auth context.
 */
function assertAuthenticatedUser(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

/**
 * getProfile
 * GET /profile
 * Returns the signed-in student's profile.
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertAuthenticatedUser(req);
    const profile = await getProfileByUserId(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * updateProfile
 * PATCH /profile
 * Updates allowed profile fields for the signed-in student.
 * Body is already validated by `validate(updateProfileSchema)`.
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertAuthenticatedUser(req);
    const input = req.body as UpdateProfileInput;

    const profile = await updateProfileByUserId(userId, input);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
