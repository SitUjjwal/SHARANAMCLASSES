/**
 * Admin Feedback Dashboard API.
 *
 * GET /admin/feedback-dashboard/stats
 * GET /admin/feedback-dashboard
 * GET /admin/feedback-dashboard/export
 */
import type {
  FeedbackDashboardCategory,
  FeedbackDashboardCsvExport,
  FeedbackDashboardListPage,
  FeedbackDashboardStats,
} from '@sharanam/shared';

import { downloadCsvFile } from '@/features/payments/api';
import { apiRequest } from '@/services/api';

export type FeedbackDashboardFilters = {
  category?: FeedbackDashboardCategory;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function fetchFeedbackDashboardStats() {
  return apiRequest<FeedbackDashboardStats>('/admin/feedback-dashboard/stats');
}

export function fetchFeedbackDashboardItems(filters: FeedbackDashboardFilters = {}) {
  return apiRequest<FeedbackDashboardListPage>('/admin/feedback-dashboard', {
    params: {
      category: filters.category ?? 'all',
      status: filters.status ?? 'all',
      search: filters.search ?? '',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function exportFeedbackDashboardCsv(
  filters: Omit<FeedbackDashboardFilters, 'page' | 'pageSize'> = {},
) {
  return apiRequest<FeedbackDashboardCsvExport>('/admin/feedback-dashboard/export', {
    params: {
      category: filters.category ?? 'all',
      status: filters.status ?? 'all',
      search: filters.search ?? '',
    },
  });
}

export { downloadCsvFile };
