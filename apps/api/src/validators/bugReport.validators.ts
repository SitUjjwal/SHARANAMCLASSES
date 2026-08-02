/**
 * Zod validators for bug reports.
 */
import { z } from 'zod';

import { BUG_REPORT_SCREENS } from '@sharanam/shared';

const screenKeys = BUG_REPORT_SCREENS.map((s) => s.key) as [
  (typeof BUG_REPORT_SCREENS)[number]['key'],
  ...(typeof BUG_REPORT_SCREENS)[number]['key'][],
];

export const bugReportScreenKeySchema = z.enum(screenKeys);

export const bugReportStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

/** Used after multer — fields arrive as strings on multipart body. */
export const createBugReportSchema = z
  .object({
    description: z.string().trim().min(10).max(4000),
    screen_key: bugReportScreenKeySchema,
  })
  .strict();

export const updateBugReportStatusSchema = z
  .object({
    status: bugReportStatusSchema,
    admin_note: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const adminBugReportsQuerySchema = z.object({
  status: bugReportStatusSchema.optional(),
});

export type CreateBugReportInput = z.infer<typeof createBugReportSchema>;
export type UpdateBugReportStatusBody = z.infer<typeof updateBugReportStatusSchema>;
