/**
 * Zod validators — subjects catalog + batch ↔ subject links.
 */
import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().max(20).nullable().optional(),
  description: z.string().trim().max(2000).optional().default(''),
  icon_url: z.string().url().max(500).nullable().optional(),
  thumbnail_url: z.string().url().max(500).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const listSubjectsQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
});

/**
 * Attach subjects to a batch. Each item either references an existing subject
 * (subject_id) or creates a new one by name.
 */
export const addBatchSubjectsSchema = z.object({
  subjects: z
    .array(
      z
        .object({
          subject_id: z.string().uuid().optional(),
          name: z.string().trim().min(2).max(80).optional(),
          teacher_id: z.string().uuid().nullable().optional(),
          sort_order: z.number().int().optional(),
        })
        .refine((item) => item.subject_id || item.name, {
          message: 'Each subject needs subject_id or name',
        }),
    )
    .min(1)
    .max(50),
});

export const updateBatchSubjectSchema = z.object({
  teacher_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const reorderBatchSubjectsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(100),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>;
export type AddBatchSubjectsInput = z.infer<typeof addBatchSubjectsSchema>;
export type UpdateBatchSubjectInput = z.infer<typeof updateBatchSubjectSchema>;
export type ReorderBatchSubjectsInput = z.infer<typeof reorderBatchSubjectsSchema>;
