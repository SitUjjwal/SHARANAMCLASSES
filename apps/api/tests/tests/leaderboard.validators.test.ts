/**
 * Unit tests: leaderboard query validator.
 */
import { describe, expect, it } from 'vitest';

import { leaderboardQuerySchema } from '../../src/validators/leaderboard.validators';

describe('leaderboardQuerySchema', () => {
  it('defaults limit to 100', () => {
    const parsed = leaderboardQuerySchema.parse({});
    expect(parsed.limit).toBe(100);
  });

  it('accepts courseId, testId, and date', () => {
    const parsed = leaderboardQuerySchema.parse({
      courseId: '11111111-1111-4111-8111-111111111111',
      testId: '22222222-2222-4222-8222-222222222222',
      date: '2026-08-01',
      limit: '50',
    });
    expect(parsed.limit).toBe(50);
    expect(parsed.date).toBe('2026-08-01');
  });

  it('rejects invalid date', () => {
    const result = leaderboardQuerySchema.safeParse({ date: '01-08-2026' });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 100', () => {
    const result = leaderboardQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});
