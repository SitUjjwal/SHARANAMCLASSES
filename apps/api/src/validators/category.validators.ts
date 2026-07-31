/**
 * Category validators.
 */
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  icon: z.string().trim().max(64).nullable().optional(),
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
