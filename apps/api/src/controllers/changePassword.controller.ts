/**
 * PUT /change-password — authenticated password rotation via Supabase Auth.
 */
import type { NextFunction, Request, Response } from 'express';

import { changePasswordForUser } from '../services/changePassword.service';
import { AppError } from '../utils/AppError';
import type { ChangePasswordInput } from '../validators/changePassword.validators';

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }

    const body = req.body as ChangePasswordInput;

    await changePasswordForUser({
      userId,
      email,
      currentPassword: body.current_password,
      newPassword: body.new_password,
    });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
