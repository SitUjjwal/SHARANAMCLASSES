/**
 * myCourse.validators.ts — query/body validation for My Courses APIs.
 */
import { z } from 'zod';

export const listMyCoursesQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
});

export const updateLastWatchedSchema = z.object({
  chapter_id: z.string().uuid(),
});

export type ListMyCoursesQuery = z.infer<typeof listMyCoursesQuerySchema>;
export type UpdateLastWatchedInput = z.infer<typeof updateLastWatchedSchema>;
