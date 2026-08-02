/**
 * Zod validators for course reviews.
 */
import { z } from 'zod';

export const createReviewSchema = z
  .object({
    course_id: z.string().uuid('course_id must be a UUID'),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z
      .string()
      .trim()
      .min(10, 'Review must be at least 10 characters')
      .max(2000, 'Review must be at most 2000 characters'),
  })
  .strict();

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z
      .string()
      .trim()
      .min(10, 'Review must be at least 10 characters')
      .max(2000, 'Review must be at most 2000 characters')
      .optional(),
  })
  .strict()
  .refine((v) => v.rating !== undefined || v.comment !== undefined, {
    message: 'Provide rating and/or comment',
  });

export const rejectReviewSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const adminReviewsQuerySchema = z.object({
  status: z
    .enum(['pending_approval', 'approved', 'rejected'])
    .optional(),
  course_id: z.string().uuid().optional(),
});

export const mineReviewQuerySchema = z.object({
  course_id: z.string().uuid('course_id must be a UUID'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
