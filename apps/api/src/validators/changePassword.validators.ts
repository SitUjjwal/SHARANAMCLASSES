/**
 * Change-password body — strong new password + confirm + current.
 */
import { z } from 'zod';

export const strongPasswordSchema = z
  .string({ required_error: 'New password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Include at least one special character');

export const changePasswordSchema = z
  .object({
    current_password: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    new_password: strongPasswordSchema,
    confirm_password: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  })
  .refine((v) => v.new_password !== v.current_password, {
    message: 'New password must be different from your current password',
    path: ['new_password'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
