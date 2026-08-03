/**
 * Auth validators — Register / Login / Forgot / Reset.
 * Aligns with mobile form rules; API uses snake_case field names.
 */
import { z } from 'zod';

import { strongPasswordSchema } from './changePassword.validators';

const classLevelEnum = z.enum([
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'competitive',
  'computer',
]);

const mediumEnum = z.enum(['hindi', 'english']);

export const loginSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  })
  .strict();

export const registerSchema = z
  .object({
    full_name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Enter your full name')
      .max(120),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Enter a valid email')
      .max(254),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    confirm_password: z
      .string({ required_error: 'Confirm password is required' })
      .min(8, 'Confirm password must be at least 8 characters')
      .max(128),
    phone_number: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(10, 'Enter a valid phone number')
      .max(15, 'Enter a valid phone number')
      .regex(/^[0-9+\-\s]+$/, 'Phone number can only contain digits and + -'),
    class_level: classLevelEnum,
    medium: mediumEnum,
  })
  .strict()
  .refine((v) => v.password === v.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email').max(254),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirm_password: z.string().min(1, 'Confirm password is required'),
  })
  .strict()
  .refine((v) => v.password === v.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
