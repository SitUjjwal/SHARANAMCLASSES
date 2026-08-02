/**
 * Zod validators for content reports.
 */
import { z } from 'zod';

export const contentReportTypeSchema = z.enum([
  'incorrect_video',
  'wrong_pdf',
  'broken_link',
  'incorrect_question',
  'duplicate_content',
]);

export const contentReportTargetTypeSchema = z.enum([
  'video',
  'pdf',
  'note',
  'question',
  'chapter',
  'course',
  'other',
]);

export const contentReportStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const createContentReportSchema = z
  .object({
    report_type: contentReportTypeSchema,
    description: z.string().trim().min(10).max(4000),
    target_type: contentReportTargetTypeSchema.nullable().optional(),
    target_id: z.string().uuid().nullable().optional(),
    course_id: z.string().uuid().nullable().optional(),
    chapter_id: z.string().uuid().nullable().optional(),
    target_label: z.string().trim().max(200).nullable().optional(),
  })
  .strict();

export const updateContentReportStatusSchema = z
  .object({
    status: contentReportStatusSchema,
    admin_note: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const adminContentReportsQuerySchema = z.object({
  status: contentReportStatusSchema.optional(),
  report_type: contentReportTypeSchema.optional(),
});

export type CreateContentReportBody = z.infer<typeof createContentReportSchema>;
export type UpdateContentReportStatusBody = z.infer<
  typeof updateContentReportStatusSchema
>;
