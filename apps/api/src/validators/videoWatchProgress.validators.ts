/**
 * Validators for video watch progress (Continue Watching).
 */
import { z } from 'zod';

export const upsertVideoWatchProgressSchema = z
  .object({
    course_id: z.string().uuid('course_id must be a UUID'),
    chapter_id: z.string().uuid('chapter_id must be a UUID'),
    position_seconds: z
      .number({ invalid_type_error: 'position_seconds must be a number' })
      .min(0, 'position_seconds must be ≥ 0')
      .max(86_400, 'position_seconds is too large'),
    duration_seconds: z
      .number({ invalid_type_error: 'duration_seconds must be a number' })
      .min(0)
      .max(86_400)
      .optional(),
  })
  .strict();

export type UpsertVideoWatchProgressBody = z.infer<typeof upsertVideoWatchProgressSchema>;
