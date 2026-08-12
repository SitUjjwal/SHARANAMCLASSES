/**
 * Zod validators for Test Series admin CRUD + list filters.
 */
import { z } from 'zod';

export const TEST_TYPES = [
  'chapter_test',
  'subject_test',
  'mock_test',
  'previous_year',
  'daily_quiz',
] as const;

const optionalUuid = z
  .union([z.string().uuid(), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v && v !== '' ? v : null));

const testBodyBase = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  instructions: z.string().trim().max(8000).optional().default(''),
  test_type: z.enum(TEST_TYPES),
  course_id: optionalUuid,
  chapter_id: optionalUuid,
  /** Subject inside the batch (batch_subjects.id) — subject-level tests */
  batch_subject_id: optionalUuid,
  duration_minutes: z.coerce.number().int().min(1).max(24 * 60),
  total_marks: z.coerce.number().positive().max(10000),
  passing_marks: z.coerce.number().positive().max(10000),
  sort_order: z.coerce.number().int().optional().default(0),
  is_free: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(false),
});

function refineTestBody(
  body: z.infer<typeof testBodyBase>,
  ctx: z.RefinementCtx,
): void {
  if (body.passing_marks > body.total_marks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passing marks cannot exceed total marks',
      path: ['passing_marks'],
    });
  }

  if (body.test_type === 'chapter_test') {
    if (!body.course_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chapter Test requires a course',
        path: ['course_id'],
      });
    }
    if (!body.chapter_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chapter Test requires a chapter',
        path: ['chapter_id'],
      });
    }
  }

  if (body.test_type === 'subject_test' && !body.course_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Subject Test requires a course',
      path: ['course_id'],
    });
  }

  if (body.chapter_id && !body.course_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Assign a course before assigning a chapter',
      path: ['course_id'],
    });
  }
}

export const createTestSchema = testBodyBase.superRefine(refineTestBody);

export const updateTestSchema = testBodyBase.partial().superRefine((body, ctx) => {
  // Only enforce mark relation when both provided
  if (
    body.passing_marks != null &&
    body.total_marks != null &&
    body.passing_marks > body.total_marks
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passing marks cannot exceed total marks',
      path: ['passing_marks'],
    });
  }
});

export const listTestsQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional().default(''),
  testType: z.enum(['all', ...TEST_TYPES]).optional().default('all'),
  access: z.enum(['free', 'paid', 'all']).optional().default('all'),
  status: z.enum(['all', 'published', 'draft']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** Student published-test list filters */
export const listStudentTestsQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional().default(''),
  testType: z.enum(['all', ...TEST_TYPES]).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type ListTestsQuery = z.infer<typeof listTestsQuerySchema>;
export type ListStudentTestsQuery = z.infer<typeof listStudentTestsQuerySchema>;
