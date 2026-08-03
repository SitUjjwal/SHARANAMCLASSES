/**
 * Auth validation endpoints — Zod gate for Register / Login / Forgot / Reset.
 *
 * These validate payload shape only (Supabase still performs auth).
 * Clients may call before signUp/signIn to get structured API errors.
 *
 *   POST /auth/validate/register
 *   POST /auth/validate/login
 *   POST /auth/validate/forgot-password
 *   POST /auth/validate/reset-password
 *   GET  /auth/staff-context  (JWT required)
 */
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { requireAuth } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { resolveStaffContext } from '../services/role.service';
import { AppError } from '../utils/AppError';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

export const staffAuthRouter = Router();

function okValidated(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      valid: true,
      payload: req.body,
    },
    message: 'Validation passed',
  });
}

staffAuthRouter.post(
  '/auth/validate/register',
  authRateLimiter,
  validate(registerSchema),
  okValidated,
);

staffAuthRouter.post(
  '/auth/validate/login',
  authRateLimiter,
  validate(loginSchema),
  okValidated,
);

staffAuthRouter.post(
  '/auth/validate/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  okValidated,
);

staffAuthRouter.post(
  '/auth/validate/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  okValidated,
);

async function getStaffContextHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const ctx = await resolveStaffContext(req.user.id, req.user.email);
    res.status(200).json({
      success: true,
      data: ctx
        ? {
            is_staff: true,
            role: ctx.role,
            profile_role: ctx.profileRole,
            permissions: ctx.permissions,
            email: ctx.email,
          }
        : {
            is_staff: false,
            role: null,
            profile_role: null,
            permissions: [],
            email: req.user.email ?? null,
          },
    });
  } catch (error) {
    next(error);
  }
}

staffAuthRouter.get(
  '/auth/staff-context',
  authRateLimiter,
  requireAuth,
  getStaffContextHandler,
);
