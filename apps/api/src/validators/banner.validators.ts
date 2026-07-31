/**
 * Zod validators for banner admin mutations.
 * Schema matches DB: id, title, image, redirect_url, status, sort_order
 * (+ optional subtitle for overlay text).
 */
import { z } from 'zod';

export const createBannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(240).nullable().optional(),
  image: z.string().url(),
  redirect_url: z.string().url().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  sort_order: z.number().int().optional().default(0),
});

export const updateBannerSchema = createBannerSchema.partial();

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
