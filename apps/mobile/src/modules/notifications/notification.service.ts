/**
 * notification.service.ts — device tokens + Notification Center inbox API.
 */
import Constants from 'expo-constants';

import { apiClient } from '@/api/client';
import type { RegisteredPushToken } from '@/modules/notifications/types';
import type {
  ApiSuccessResponse,
  DevicePushToken,
  NotificationHistoryPage,
  NotificationInboxItem,
} from '@sharanam/shared';

export async function syncPushTokenToBackend(
  token: RegisteredPushToken,
): Promise<DevicePushToken> {
  const { data } = await apiClient.put<ApiSuccessResponse<DevicePushToken>>(
    '/devices/push-token',
    {
      device_id: token.deviceId,
      token: token.token,
      provider: token.provider,
      platform: token.platform,
      app_version: Constants.expoConfig?.version ?? null,
    },
  );
  return data.data;
}

export async function deactivatePushTokenOnBackend(
  token: RegisteredPushToken,
): Promise<void> {
  await apiClient.delete('/devices/push-token', {
    data: {
      device_id: token.deviceId,
      token: token.token,
    },
  });
}

export async function fetchNotificationHistoryPage(params: {
  page?: number;
  pageSize?: number;
}): Promise<NotificationHistoryPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<NotificationHistoryPage>>(
    '/notification-history',
    {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    },
  );
  return data.data;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ unreadCount: number }>
  >('/notification-history/unread-count');
  return data.data.unreadCount;
}

export async function markNotificationRead(
  inboxId: string,
): Promise<NotificationInboxItem> {
  const { data } = await apiClient.patch<ApiSuccessResponse<NotificationInboxItem>>(
    `/notification-history/${inboxId}/read`,
  );
  return data.data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ updated: number }>>(
    '/notification-history/read-all',
  );
  return data.data;
}

export async function deleteNotification(inboxId: string): Promise<void> {
  await apiClient.delete(`/notification-history/${inboxId}`);
}
