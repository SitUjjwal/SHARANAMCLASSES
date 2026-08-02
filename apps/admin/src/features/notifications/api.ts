/**
 * Admin Notification compose + campaign list API.
 *
 * POST /notifications
 * GET  /notifications
 * POST /notifications/send
 */
import type { NotificationAudienceType, NotificationType } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type AdminNotificationCampaign = {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  data: Record<string, string>;
  notification_type: NotificationType | string;
  audience_type: NotificationAudienceType;
  audience_user_id: string | null;
  audience_class_level: string | null;
  audience_course_id: string | null;
  status: string;
  target_user_count: number;
  push_success_count: number;
  push_failure_count: number;
  sent_at: string | null;
  created_at: string;
};

export type CreateAdminNotificationInput = {
  title: string;
  body: string;
  deep_link?: string | null;
  notification_type?: NotificationType;
  audience_type: NotificationAudienceType;
  audience_user_id?: string;
  audience_class_level?: string;
  audience_course_id?: string;
  send?: boolean;
};

export function listAdminNotifications(limit = 50) {
  return apiRequest<AdminNotificationCampaign[]>('/notifications', {
    params: { limit },
  });
}

export function createAdminNotification(input: CreateAdminNotificationInput) {
  return apiRequest<AdminNotificationCampaign>('/notifications', {
    method: 'POST',
    body: input,
  });
}

export function updateAdminNotification(
  notificationId: string,
  input: CreateAdminNotificationInput,
) {
  return apiRequest<AdminNotificationCampaign>(`/notifications/${notificationId}`, {
    method: 'PUT',
    body: input,
  });
}

export function deleteAdminNotification(notificationId: string) {
  return apiRequest<null>(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

export function sendAdminNotification(notificationId: string) {
  return apiRequest<AdminNotificationCampaign>('/notifications/send', {
    method: 'POST',
    body: { notification_id: notificationId },
  });
}

export {
  downloadCsvFile,
  exportNotificationAdminCsv,
  fetchNotificationAdminCampaigns,
  fetchNotificationAdminStats,
  type NotificationDashboardFilters,
} from './dashboardApi';
