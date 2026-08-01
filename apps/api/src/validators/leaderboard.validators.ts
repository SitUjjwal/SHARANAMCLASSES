/**
 * Zod validators for Test Leaderboard query filters.
 */
import { z } from 'zod';

const optionalUuid = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().uuid().optional(),
);

/** YYYY-MM-DD calendar day filter on submitted_at (UTC day bounds). */
const optionalDate = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
);

export const leaderboardQuerySchema = z.object({
  courseId: optionalUuid,
  testId: optionalUuid,
  date: optionalDate,
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
