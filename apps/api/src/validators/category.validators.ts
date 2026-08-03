/**
 * Category validators.
 */
import { z } from 'zod';

const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === '' ||
      /^https?:\/\//i.test(v) ||
      /^tel:/i.test(v) ||
      /^mailto:/i.test(v),
    { message: 'Must be empty or a valid http(s)/tel/mailto URL' },
  );

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  /** Emoji, Ionicon name, or image URL */
  icon: z.string().trim().max(500).nullable().optional(),
  /** Optional social / external link opened when student taps the tile */
  link_url: linkUrl.nullable().optional(),
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
