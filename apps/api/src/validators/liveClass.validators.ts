/**
 * Zod validators for live class admin CRUD + list + notify.
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
      'Invalid YouTube Live URL. Paste a youtube.com or youtu.be /live link.',
  });

const isoDateTime = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Must be a valid ISO date-time',
  });

export const createLiveClassSchema = z
  .object({
    course_id: z.string().uuid().nullable().optional(),
    subject_id: z.string().uuid().nullable().optional(),
    chapter_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(4000).optional().default(''),
    youtube_url: youtubeUrlField,
    thumbnail_url: z.string().url().nullable().optional(),
    start_time: isoDateTime,
    end_time: isoDateTime,
    is_published: z.boolean().optional().default(true),
  })
  .superRefine((value, ctx) => {
    const start = Date.parse(value.start_time);
    const end = Date.parse(value.end_time);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['end_time'],
      });
    }
  });

export const updateLiveClassSchema = z
  .object({
    course_id: z.string().uuid().nullable().optional(),
    subject_id: z.string().uuid().nullable().optional(),
    chapter_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    youtube_url: youtubeUrlField.optional(),
    thumbnail_url: z.string().url().nullable().optional(),
    start_time: isoDateTime.optional(),
    end_time: isoDateTime.optional(),
    is_published: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.start_time && value.end_time) {
      const start = Date.parse(value.start_time);
      const end = Date.parse(value.end_time);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['end_time'],
        });
      }
    }
  });

export const listLiveClassesQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'upcoming', 'live', 'ended']).optional().default('all'),
  publishStatus: z.enum(['all', 'published', 'draft']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const notifyLiveClassSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  body: z.string().trim().min(2).max(1000).optional(),
});

export type CreateLiveClassInput = z.infer<typeof createLiveClassSchema>;
export type UpdateLiveClassInput = z.infer<typeof updateLiveClassSchema>;
export type ListLiveClassesQuery = z.infer<typeof listLiveClassesQuerySchema>;
export type NotifyLiveClassInput = z.infer<typeof notifyLiveClassSchema>;
