/**
 * Admin Notification Dashboard / Delivery Reports API.
 *
 * GET /admin/notifications/stats
 * GET /admin/notifications/campaigns
 * GET /admin/notifications/export
 */
import type {
  NotificationAdminCsvExport,
  NotificationAdminListPage,
  NotificationAdminStats,
  NotificationCampaignStatus,
  NotificationType,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';
import { downloadCsvFile } from '@/features/payments/api';

export type NotificationDashboardFilters = {
  search?: string;
  status?: 'all' | NotificationCampaignStatus;
  type?: 'all' | NotificationType;
  page?: number;
  pageSize?: number;
};

export function fetchNotificationAdminStats() {
  return apiRequest<NotificationAdminStats>('/admin/notifications/stats');
}

export function fetchNotificationAdminCampaigns(
  filters: NotificationDashboardFilters = {},
) {
  return apiRequest<NotificationAdminListPage>('/admin/notifications/campaigns', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
      type: filters.type ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function exportNotificationAdminCsv(
  filters: Omit<NotificationDashboardFilters, 'page' | 'pageSize'> = {},
) {
  return apiRequest<NotificationAdminCsvExport>('/admin/notifications/export', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
      type: filters.type ?? 'all',
    },
  });
}

export { downloadCsvFile };
