/**
 * Zod schemas for auth forms.
 * Why: single source of validation rules for React Hook Form + runtime checks.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * registerSchema
 * Enforces: name, email, password (8+), match, phone, class, medium.
 */
export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name is required')
      .min(2, 'Enter your full name'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(8, 'Confirm password must be at least 8 characters'),
    phoneNumber: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(1, 'Phone number is required')
      .min(10, 'Enter a valid phone number')
      .max(15, 'Enter a valid phone number')
      .regex(/^[0-9+\-\s]+$/, 'Phone number can only contain digits'),
    classLevel: z.enum(['9', '10', '11', '12'], {
      required_error: 'Class is required',
      invalid_type_error: 'Class is required',
    }),
    medium: z.enum(['hindi', 'english'], {
      required_error: 'Medium is required',
      invalid_type_error: 'Medium is required',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
});

/**
 * resetPasswordSchema
 * New password + confirm after the student opens the email deep link.
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
