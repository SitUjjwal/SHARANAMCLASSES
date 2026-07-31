/**
 * Admin payment list / export validators.
 */
import { z } from 'zod';

export const adminListPaymentsQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  status: z
    .enum(['all', 'created', 'paid', 'failed', 'expired'])
    .optional()
    .default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminExportPaymentsQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  status: z
    .enum(['all', 'created', 'paid', 'failed', 'expired'])
    .optional()
    .default('all'),
});

export type AdminListPaymentsQuery = z.infer<typeof adminListPaymentsQuerySchema>;
export type AdminExportPaymentsQuery = z.infer<typeof adminExportPaymentsQuerySchema>;
