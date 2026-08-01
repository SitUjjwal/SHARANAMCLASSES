/**
 * Zod validators for student test attempts (start + auto-save answers).
 */
import { z } from 'zod';

export const ANSWER_KEYS = ['A', 'B', 'C', 'D'] as const;

export const saveAttemptAnswersSchema = z.object({
  current_question_index: z.coerce.number().int().min(0).optional(),
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        selected_answer: z.enum(ANSWER_KEYS).nullable(),
        is_marked_for_review: z.boolean().optional().default(false),
      }),
    )
    .max(500),
});

export type SaveAttemptAnswersInput = z.infer<typeof saveAttemptAnswersSchema>;

/** Credit background pause time onto ends_at (client Timer pauseInBackground). */
export const pauseCreditSchema = z.object({
  paused_ms: z.coerce.number().int().min(1).max(2 * 60 * 60 * 1000),
});

export type PauseCreditInput = z.infer<typeof pauseCreditSchema>;

/** Canonical POST /submit-test */
export const submitTestBodySchema = z.object({
  attempt_id: z.string().uuid(),
  reason: z.enum(['manual', 'auto']).optional().default('manual'),
});

export type SubmitTestBody = z.infer<typeof submitTestBodySchema>;

/** Canonical GET /results list query */
export const listResultsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ListResultsQuery = z.infer<typeof listResultsQuerySchema>;
