/**
 * Zod validators for Announcement admin CRUD.
 */
import { z } from 'zod';

const optionalUrl = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return value;
  });

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().max(50_000).optional().default(''),
  image_url: optionalUrl,
  is_pinned: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
  scheduled_at: z.string().min(10).optional(),
  sort_order: z.number().int().optional().default(0),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
