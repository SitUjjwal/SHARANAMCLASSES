/**
 * Zod validators for student feedback tickets.
 */
import { z } from 'zod';

export const feedbackTypeSchema = z.enum([
  'general',
  'course',
  'teacher',
  'suggestion',
  'complaint',
]);

export const feedbackStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const createFeedbackSchema = z
  .object({
    feedback_type: feedbackTypeSchema,
    title: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(4000),
    course_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    teacher_name: z.string().trim().min(2).max(120).nullable().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.feedback_type === 'course' && !val.course_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'course_id is required for course feedback',
        path: ['course_id'],
      });
    }
    if (
      val.feedback_type === 'teacher' &&
      !val.teacher_id &&
      !val.teacher_name?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'teacher_id or teacher_name is required for teacher feedback',
        path: ['teacher_name'],
      });
    }
  });

export const updateFeedbackStatusSchema = z
  .object({
    status: feedbackStatusSchema,
    admin_note: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const updateFeedbackContentSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    message: z.string().trim().min(10).max(4000).optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.message !== undefined, {
    message: 'Provide title and/or message',
  });

export const adminFeedbackQuerySchema = z.object({
  status: feedbackStatusSchema.optional(),
  feedback_type: feedbackTypeSchema.optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type UpdateFeedbackContentInput = z.infer<typeof updateFeedbackContentSchema>;
