/**
 * Zod validators for video admin CRUD + list filters.
 */
import { z } from 'zod';

import { isValidYouTubeUrl } from '../utils/youtube';

const youtubeUrlField = z
  .string()
  .trim()
  .min(11)
  .max(500)
  .refine((value) => isValidYouTubeUrl(value), {
    message:
      'Invalid YouTube URL. Paste an unlisted/public youtube.com or youtu.be link.',
  });

export const createVideoSchema = z.object({
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  youtube_url: youtubeUrlField,
  video_type: z.enum(['recorded', 'live']).optional().default('recorded'),
  thumbnail_url: z.string().url().nullable().optional(),
  duration_seconds: z.number().int().min(0).optional().default(0),
  sort_order: z.number().int().optional().default(0),
  is_free: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
});

export const updateVideoSchema = createVideoSchema.partial();

export const listVideosQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  videoType: z.enum(['recorded', 'live', 'all']).optional().default('all'),
  access: z.enum(['free', 'paid', 'all']).optional().default('all'),
  status: z.enum(['all', 'published', 'draft']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>;
