/**
 * Profile request validators (Zod).
 * Why: reject bad update payloads before they hit the database.
 */
import { z } from 'zod';

/**
 * updateProfileSchema
 * Partial update — at least one field required.
 * Email is NOT updatable here (owned by Supabase Auth).
 */
export const updateProfileSchema = z
  .object({
    full_name: z
      .string({ invalid_type_error: 'full_name must be a string' })
      .trim()
      .min(2, 'full_name must be at least 2 characters')
      .optional(),
    phone_number: z
      .string({ invalid_type_error: 'phone_number must be a string' })
      .trim()
      .min(10, 'phone_number must be at least 10 digits')
      .max(15, 'phone_number is too long')
      .regex(/^[0-9+\-\s]+$/, 'phone_number contains invalid characters')
      .optional(),
    class_level: z
      .enum(['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'], {
        errorMap: () => ({
          message:
            'class_level must be 6–12, competitive, or computer',
        }),
      })
      .optional(),
    medium: z.enum(['hindi', 'english'], {
      errorMap: () => ({ message: 'medium must be hindi or english' }),
    }).optional(),
    avatar_url: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        if (value === null || value === '') return null;
        return value;
      }),
    avatar_storage_key: z
      .union([z.string().trim().min(3).max(500), z.literal(''), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        if (value === null || value === '') return null;
        return value;
      }),
  })
  .strict()
  .refine(
    (value) =>
      value.full_name !== undefined ||
      value.phone_number !== undefined ||
      value.class_level !== undefined ||
      value.medium !== undefined ||
      value.avatar_url !== undefined ||
      value.avatar_storage_key !== undefined,
    {
      message: 'Provide at least one field to update',
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
