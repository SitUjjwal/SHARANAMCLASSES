/**
 * Unit tests: admin payment timezone helpers + validators.
 */
import { describe, expect, it } from 'vitest';

import {
  kolkataDayBounds,
  kolkataMonthBounds,
} from '../../src/services/paymentAdmin.service';
import {
  adminExportPaymentsQuerySchema,
  adminListPaymentsQuerySchema,
} from '../../src/validators/paymentAdmin.validators';

describe('paymentAdmin validators', () => {
  it('defaults list query fields', () => {
    const parsed = adminListPaymentsQuerySchema.parse({});
    expect(parsed.search).toBe('');
    expect(parsed.status).toBe('all');
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it('accepts status filters', () => {
    const parsed = adminListPaymentsQuerySchema.parse({
      status: 'failed',
      page: '2',
      search: ' maths ',
    });
    expect(parsed.status).toBe('failed');
    expect(parsed.page).toBe(2);
    expect(parsed.search).toBe('maths');
  });

  it('defaults export query', () => {
    const parsed = adminExportPaymentsQuerySchema.parse({});
    expect(parsed.status).toBe('all');
    expect(parsed.search).toBe('');
  });
});

describe('Kolkata day/month bounds', () => {
  it('places a known IST midday inside the same calendar day', () => {
    // 2026-08-01 12:00 IST = 2026-08-01 06:30 UTC
    const now = new Date('2026-08-01T06:30:00.000Z');
    const { start, end } = kolkataDayBounds(now);
    expect(start.toISOString()).toBe('2026-07-31T18:30:00.000Z');
    expect(end.getTime()).toBeGreaterThan(now.getTime());
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(now.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('month bounds cover first of month IST', () => {
    const now = new Date('2026-08-15T06:30:00.000Z');
    const { start, end } = kolkataMonthBounds(now);
    const firstIst = new Date('2026-08-01T00:00:00+05:30');
    expect(start.getTime()).toBe(firstIst.getTime());
    expect(end.getTime()).toBeGreaterThan(now.getTime());
  });
});
