/**
 * Zod schemas for auth forms.
 * Why: single source of validation rules for React Hook Form + runtime checks.
 */
import { z } from 'zod';

/**
 * Strong password rules (Change Password / Reset).
 * Min 8 + upper + lower + number + special.
 */
export const strongPasswordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Include at least one special character');

export type PasswordStrengthChecks = {
  minLength: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordStrengthChecks(password: string): PasswordStrengthChecks {
  return {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = getPasswordStrengthChecks(password);
  return c.minLength && c.upper && c.lower && c.number && c.special;
}

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
    classLevel: z.enum(
      ['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'],
      {
        required_error: 'Class is required',
        invalid_type_error: 'Class is required',
      },
    ),
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
    password: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

/**
 * changePasswordSchema
 * Logged-in student: prove current password, then set a strong new one.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
