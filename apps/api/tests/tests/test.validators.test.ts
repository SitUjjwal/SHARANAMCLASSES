/**
 * Unit tests: Test Series validators (types, marks, assignment rules).
 */
import { describe, expect, it } from 'vitest';

import {
  createTestSchema,
  listTestsQuerySchema,
  updateTestSchema,
} from '../../src/validators/test.validators';

const COURSE_ID = '11111111-1111-1111-1111-111111111111';
const CHAPTER_ID = '22222222-2222-2222-2222-222222222222';

describe('createTestSchema', () => {
  it('accepts a valid chapter test', () => {
    const parsed = createTestSchema.parse({
      title: 'Real Numbers Test',
      test_type: 'chapter_test',
      course_id: COURSE_ID,
      chapter_id: CHAPTER_ID,
      duration_minutes: 60,
      total_marks: 100,
      passing_marks: 33,
    });
    expect(parsed.test_type).toBe('chapter_test');
    expect(parsed.course_id).toBe(COURSE_ID);
    expect(parsed.is_published).toBe(false);
  });

  it('rejects chapter test without chapter', () => {
    const result = createTestSchema.safeParse({
      title: 'Real Numbers Test',
      test_type: 'chapter_test',
      course_id: COURSE_ID,
      duration_minutes: 60,
      total_marks: 100,
      passing_marks: 33,
    });
    expect(result.success).toBe(false);
  });

  it('rejects passing marks above total', () => {
    const result = createTestSchema.safeParse({
      title: 'Mock',
      test_type: 'mock_test',
      duration_minutes: 180,
      total_marks: 100,
      passing_marks: 120,
    });
    expect(result.success).toBe(false);
  });

  it('accepts daily quiz without course', () => {
    const parsed = createTestSchema.parse({
      title: 'Daily Algebra',
      test_type: 'daily_quiz',
      duration_minutes: 15,
      total_marks: 20,
      passing_marks: 8,
      is_free: true,
    });
    expect(parsed.course_id).toBeNull();
    expect(parsed.is_free).toBe(true);
  });
});

describe('updateTestSchema', () => {
  it('allows partial title update', () => {
    const parsed = updateTestSchema.parse({ title: 'Renamed Test' });
    expect(parsed.title).toBe('Renamed Test');
  });
});

describe('listTestsQuerySchema', () => {
  it('defaults filters', () => {
    const parsed = listTestsQuerySchema.parse({});
    expect(parsed.testType).toBe('all');
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });
});
