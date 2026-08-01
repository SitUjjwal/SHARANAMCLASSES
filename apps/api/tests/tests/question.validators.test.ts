/**
 * Unit tests: question validators + Excel header aliases.
 */
import { describe, expect, it } from 'vitest';

import {
  bulkQuestionRowSchema,
  createQuestionBodySchema,
  updateQuestionSchema,
} from '../../src/validators/question.validators';

describe('createQuestionBodySchema', () => {
  it('accepts a valid MCQ', () => {
    const parsed = createQuestionBodySchema.parse({
      question_text: 'What is 2+2?',
      option_a: '3',
      option_b: '4',
      option_c: '5',
      option_d: '22',
      correct_answer: 'B',
      marks: 1,
      negative_marks: 0.25,
    });
    expect(parsed.correct_answer).toBe('B');
    expect(parsed.negative_marks).toBe(0.25);
  });

  it('rejects negative marks above marks', () => {
    const result = createQuestionBodySchema.safeParse({
      question_text: 'What is 2+2?',
      option_a: '3',
      option_b: '4',
      option_c: '5',
      option_d: '22',
      correct_answer: 'B',
      marks: 1,
      negative_marks: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid correct_answer', () => {
    const result = createQuestionBodySchema.safeParse({
      question_text: 'Q',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'E',
      marks: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('bulkQuestionRowSchema', () => {
  it('normalizes lowercase correct answer', () => {
    const parsed = bulkQuestionRowSchema.parse({
      question_text: 'Q',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'c',
    });
    expect(parsed.correct_answer).toBe('C');
    expect(parsed.marks).toBe(1);
  });
});

describe('updateQuestionSchema', () => {
  it('allows partial explanation update', () => {
    const parsed = updateQuestionSchema.parse({ explanation: 'Because…' });
    expect(parsed.explanation).toBe('Because…');
  });
});
