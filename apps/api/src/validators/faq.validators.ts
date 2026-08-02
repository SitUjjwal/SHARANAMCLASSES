/**
 * Zod validators for FAQs.
 */
import { z } from 'zod';

export const createFaqSchema = z
  .object({
    question: z.string().trim().min(3).max(300),
    answer: z.string().trim().min(3).max(8000),
    category: z.string().trim().max(80).nullable().optional(),
    sort_order: z.coerce.number().int().min(0).max(100000).optional(),
    is_published: z.boolean().optional().default(true),
  })
  .strict();

export const updateFaqSchema = createFaqSchema.partial().strict().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'Provide at least one field to update' },
);

export const reorderFaqsSchema = z
  .object({
    ordered_ids: z.array(z.string().uuid()).min(1),
  })
  .strict();

export const listFaqsQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
});

export type CreateFaqBody = z.infer<typeof createFaqSchema>;
export type UpdateFaqBody = z.infer<typeof updateFaqSchema>;
export type ReorderFaqsBody = z.infer<typeof reorderFaqsSchema>;
