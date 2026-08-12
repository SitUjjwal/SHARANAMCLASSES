/**
 * Unit tests: Batch + Subject validators (batch rules, stream requirement,
 * pricing sanity, subject attach payloads).
 */
import { describe, expect, it } from 'vitest';

import {
  createBatchSchema,
  updateBatchSchema,
  createChapterSchema,
} from '../../src/validators/course.validators';
import {
  addBatchSubjectsSchema,
  createSubjectSchema,
  reorderBatchSubjectsSchema,
  updateBatchSubjectSchema,
} from '../../src/validators/subject.validators';

const SUBJECT_ID = '11111111-1111-1111-1111-111111111111';
const TEACHER_ID = '22222222-2222-2222-2222-222222222222';
const BS_ID = '33333333-3333-3333-3333-333333333333';

const validBatch = {
  title: 'Class 10 Bihar Board Batch 2026-27',
  slug: 'class-10-bihar-board-2026-27',
  description: 'Full year batch',
  class_level: '10',
  medium: 'hindi',
  board: 'bihar_board',
  academic_year: '2026-2027',
  price: 999,
};

describe('createBatchSchema', () => {
  it('accepts a valid class 10 batch (no stream needed)', () => {
    const parsed = createBatchSchema.parse(validBatch);
    expect(parsed.class_level).toBe('10');
    expect(parsed.stream ?? null).toBeNull();
    expect(parsed.price).toBe(999);
  });

  it('requires stream for class 11', () => {
    const result = createBatchSchema.safeParse({
      ...validBatch,
      class_level: '11',
    });
    expect(result.success).toBe(false);
  });

  it('accepts class 12 with stream science', () => {
    const parsed = createBatchSchema.parse({
      ...validBatch,
      class_level: '12',
      stream: 'science',
    });
    expect(parsed.stream).toBe('science');
  });

  it('rejects missing medium', () => {
    const { medium: _m, ...rest } = validBatch;
    const result = createBatchSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = createBatchSchema.safeParse({ ...validBatch, price: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects original_price below price', () => {
    const result = createBatchSchema.safeParse({
      ...validBatch,
      price: 999,
      original_price: 500,
    });
    expect(result.success).toBe(false);
  });

  it('accepts original_price above price with dates', () => {
    const parsed = createBatchSchema.parse({
      ...validBatch,
      original_price: 1999,
      discount_percent: 50,
      start_date: '2026-04-01',
      end_date: '2027-03-31',
    });
    expect(parsed.original_price).toBe(1999);
    expect(parsed.end_date).toBe('2027-03-31');
  });

  it('rejects end_date before start_date', () => {
    const result = createBatchSchema.safeParse({
      ...validBatch,
      start_date: '2026-04-01',
      end_date: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed academic year', () => {
    const result = createBatchSchema.safeParse({
      ...validBatch,
      academic_year: '2026/27',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateBatchSchema', () => {
  it('allows partial update', () => {
    const parsed = updateBatchSchema.parse({ price: 1299 });
    expect(parsed.price).toBe(1299);
  });

  it('still validates stream rule when class provided', () => {
    const result = updateBatchSchema.safeParse({ class_level: '12' });
    expect(result.success).toBe(false);
  });
});

describe('createSubjectSchema', () => {
  it('accepts a subject with defaults', () => {
    const parsed = createSubjectSchema.parse({ name: 'Mathematics' });
    expect(parsed.status).toBe('active');
    expect(parsed.description).toBe('');
  });

  it('rejects a 1-char name', () => {
    expect(createSubjectSchema.safeParse({ name: 'M' }).success).toBe(false);
  });

  it('rejects non-URL icon', () => {
    expect(
      createSubjectSchema.safeParse({ name: 'Maths', icon_url: 'not-a-url' }).success,
    ).toBe(false);
  });
});

describe('addBatchSubjectsSchema', () => {
  it('accepts existing subject ids and new names mixed', () => {
    const parsed = addBatchSubjectsSchema.parse({
      subjects: [
        { subject_id: SUBJECT_ID, teacher_id: TEACHER_ID },
        { name: 'Optional Subject' },
      ],
    });
    expect(parsed.subjects).toHaveLength(2);
  });

  it('rejects an item without subject_id or name', () => {
    const result = addBatchSubjectsSchema.safeParse({
      subjects: [{ teacher_id: TEACHER_ID }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty list', () => {
    expect(addBatchSubjectsSchema.safeParse({ subjects: [] }).success).toBe(false);
  });
});

describe('updateBatchSubjectSchema / reorder', () => {
  it('accepts status toggle', () => {
    const parsed = updateBatchSubjectSchema.parse({ status: 'inactive' });
    expect(parsed.status).toBe('inactive');
  });

  it('reorder requires uuid list', () => {
    expect(
      reorderBatchSubjectsSchema.safeParse({ orderedIds: ['nope'] }).success,
    ).toBe(false);
    expect(
      reorderBatchSubjectsSchema.parse({ orderedIds: [BS_ID] }).orderedIds,
    ).toHaveLength(1);
  });
});

describe('createChapterSchema with batch_subject_id', () => {
  it('accepts a chapter linked to a batch subject', () => {
    const parsed = createChapterSchema.parse({
      title: 'Chapter 1 – Real Numbers',
      batch_subject_id: BS_ID,
    });
    expect(parsed.batch_subject_id).toBe(BS_ID);
  });

  it('accepts legacy chapter without batch_subject_id', () => {
    const parsed = createChapterSchema.parse({ title: 'Chapter 1' });
    expect(parsed.batch_subject_id ?? null).toBeNull();
  });
});
