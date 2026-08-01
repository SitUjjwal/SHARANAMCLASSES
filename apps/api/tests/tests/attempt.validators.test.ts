/**
 * Unit tests: attempt answer auto-save validator.
 */
import { describe, expect, it } from 'vitest';

import { saveAttemptAnswersSchema } from '../../src/validators/attempt.validators';

describe('saveAttemptAnswersSchema', () => {
  it('accepts answers with null selection (clear)', () => {
    const parsed = saveAttemptAnswersSchema.parse({
      current_question_index: 1,
      answers: [
        {
          question_id: '11111111-1111-4111-8111-111111111111',
          selected_answer: null,
          is_marked_for_review: true,
        },
      ],
    });
    expect(parsed.answers[0]?.selected_answer).toBeNull();
    expect(parsed.answers[0]?.is_marked_for_review).toBe(true);
  });

  it('accepts A–D selections', () => {
    const parsed = saveAttemptAnswersSchema.parse({
      answers: [
        {
          question_id: '11111111-1111-4111-8111-111111111111',
          selected_answer: 'C',
        },
      ],
    });
    expect(parsed.answers[0]?.selected_answer).toBe('C');
    expect(parsed.answers[0]?.is_marked_for_review).toBe(false);
  });

  it('rejects invalid answer keys', () => {
    const result = saveAttemptAnswersSchema.safeParse({
      answers: [
        {
          question_id: '11111111-1111-4111-8111-111111111111',
          selected_answer: 'E',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('pauseCreditSchema', () => {
  it('accepts paused_ms in range', async () => {
    const { pauseCreditSchema } = await import(
      '../../src/validators/attempt.validators'
    );
    const parsed = pauseCreditSchema.parse({ paused_ms: 12_000 });
    expect(parsed.paused_ms).toBe(12_000);
  });

  it('rejects zero pause', async () => {
    const { pauseCreditSchema } = await import(
      '../../src/validators/attempt.validators'
    );
    expect(pauseCreditSchema.safeParse({ paused_ms: 0 }).success).toBe(false);
  });
});
