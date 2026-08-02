/**
 * Validators for Admin Feedback Dashboard.
 */
import { z } from 'zod';

export const feedbackDashboardCategorySchema = z.enum([
  'pending_reviews',
  'approved_reviews',
  'bug_reports',
  'support_tickets',
  'feature_requests',
  'support_chat',
  'all',
]);

export const feedbackDashboardListQuerySchema = z.object({
  category: feedbackDashboardCategorySchema.optional().default('all'),
  status: z.string().trim().max(40).optional().default('all'),
  search: z.string().trim().max(120).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const feedbackDashboardExportQuerySchema = z.object({
  category: feedbackDashboardCategorySchema.optional().default('all'),
  status: z.string().trim().max(40).optional().default('all'),
  search: z.string().trim().max(120).optional().default(''),
});

export type FeedbackDashboardListQueryInput = z.infer<
  typeof feedbackDashboardListQuerySchema
>;
export type FeedbackDashboardExportQueryInput = z.infer<
  typeof feedbackDashboardExportQuerySchema
>;
