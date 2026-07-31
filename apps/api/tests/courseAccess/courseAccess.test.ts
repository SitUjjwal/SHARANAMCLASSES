/**
 * Unit tests: course access lock rule + context helpers.
 */
import { describe, expect, it } from 'vitest';

import {
  isMediaLocked,
  toCourseAccessContext,
} from '../../src/services/courseAccess.service';

describe('isMediaLocked', () => {
  it('unlocks all media when purchased/enrolled', () => {
    expect(isMediaLocked(true, false)).toBe(false);
    expect(isMediaLocked(true, true)).toBe(false);
  });

  it('unlocks only free preview when not purchased', () => {
    expect(isMediaLocked(false, true)).toBe(false);
    expect(isMediaLocked(false, false)).toBe(true);
  });
});

describe('toCourseAccessContext', () => {
  it('sets mode full when hasFullAccess', () => {
    const ctx = toCourseAccessContext('u1', 'c1', true);
    expect(ctx.mode).toBe('full');
    expect(ctx.hasFullAccess).toBe(true);
  });

  it('sets mode preview when not purchased', () => {
    const ctx = toCourseAccessContext('u1', 'c1', false);
    expect(ctx.mode).toBe('preview');
    expect(ctx.hasFullAccess).toBe(false);
  });
});
