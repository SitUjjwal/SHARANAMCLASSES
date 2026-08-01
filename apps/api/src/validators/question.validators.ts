/**
 * Zod validators for Question Management (MCQ) + list + bulk import.
 */
import { z } from 'zod';

export const CORRECT_ANSWERS = ['A', 'B', 'C', 'D'] as const;

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);

const questionFields = z.object({
  question_text: nonEmptyText(4000),
  option_a: nonEmptyText(1000),
  option_b: nonEmptyText(1000),
  option_c: nonEmptyText(1000),
  option_d: nonEmptyText(1000),
  correct_answer: z.enum(CORRECT_ANSWERS),
  explanation: z.string().trim().max(4000).optional().default(''),
  marks: z.coerce.number().positive().max(1000),
  negative_marks: z.coerce.number().min(0).max(1000).optional().default(0),
  sort_order: z.coerce.number().int().optional().default(0),
});

/** Body for POST /tests/:testId/questions (test_id from path) */
export const createQuestionBodySchema = questionFields.superRefine((body, ctx) => {
  if (body.negative_marks > body.marks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Negative marks cannot exceed question marks',
      path: ['negative_marks'],
    });
  }
});

export const createQuestionSchema = questionFields
  .extend({ test_id: z.string().uuid() })
  .superRefine((body, ctx) => {
    if (body.negative_marks > body.marks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Negative marks cannot exceed question marks',
        path: ['negative_marks'],
      });
    }
  });

export const updateQuestionSchema = questionFields.partial().superRefine((body, ctx) => {
  if (
    typeof body.marks === 'number' &&
    typeof body.negative_marks === 'number' &&
    body.negative_marks > body.marks
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Negative marks cannot exceed question marks',
      path: ['negative_marks'],
    });
  }
});

export const listQuestionsQuerySchema = z.object({
  testId: z.string().uuid(),
  search: z.string().trim().max(200).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const listQuestionsPathQuerySchema = z.object({
  search: z.string().trim().max(200).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** One row from Excel / JSON bulk body */
export const bulkQuestionRowSchema = z.object({
  question_text: nonEmptyText(4000),
  option_a: nonEmptyText(1000),
  option_b: nonEmptyText(1000),
  option_c: nonEmptyText(1000),
  option_d: nonEmptyText(1000),
  correct_answer: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(CORRECT_ANSWERS)),
  explanation: z.string().trim().max(4000).optional().default(''),
  marks: z.coerce.number().positive().max(1000).optional().default(1),
  negative_marks: z.coerce.number().min(0).max(1000).optional().default(0),
  sort_order: z.coerce.number().int().optional(),
});

export type CreateQuestionBody = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: (typeof CORRECT_ANSWERS)[number];
  explanation: string;
  marks: number;
  negative_marks: number;
  sort_order: number;
};

export type CreateQuestionInput = CreateQuestionBody & { test_id: string };

export type UpdateQuestionInput = Partial<CreateQuestionBody>;

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
export type BulkQuestionRow = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: (typeof CORRECT_ANSWERS)[number];
  explanation: string;
  marks: number;
  negative_marks: number;
  sort_order?: number;
};