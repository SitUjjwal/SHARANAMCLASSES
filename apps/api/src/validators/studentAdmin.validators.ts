/**
 * Admin student management validators.
 */
import { z } from 'zod';

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  class_level: z
    .enum(['', '6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'])
    .optional()
    .default(''),
  medium: z.enum(['', 'hindi', 'english']).optional().default(''),
  status: z.enum(['all', 'active', 'suspended']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const updateStudentSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120).optional(),
    phone_number: z
      .string()
      .trim()
      .min(10)
      .max(15)
      .regex(/^[0-9+\-\s]+$/)
      .optional(),
    class_level: z
      .enum(['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'])
      .optional(),
    medium: z.enum(['hindi', 'english']).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.full_name !== undefined ||
      v.phone_number !== undefined ||
      v.class_level !== undefined ||
      v.medium !== undefined,
    { message: 'Provide at least one field to update' },
  );

export const suspendStudentSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const resetStudentPasswordSchema = z
  .object({
    new_password: z
      .string()
      .trim()
      .min(8)
      .max(72)
      .optional(),
  })
  .strict();

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type SuspendStudentInput = z.infer<typeof suspendStudentSchema>;
export type ResetStudentPasswordInput = z.infer<typeof resetStudentPasswordSchema>;
