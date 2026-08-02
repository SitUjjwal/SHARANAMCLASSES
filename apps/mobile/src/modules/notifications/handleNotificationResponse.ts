/**
 * handleNotificationResponse.ts — user tapped a notification.
 * Foreground / background / cold start → deepLinking queue + navigate.
 */
import * as Notifications from 'expo-notifications';

import { openDeepLinkFromNotificationData } from '@/navigation/deepLinking';

export function handleNotificationData(
  data: Record<string, unknown> | undefined,
  _navigation?: unknown,
): void {
  openDeepLinkFromNotificationData(data);
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  _navigation?: unknown,
): void {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  openDeepLinkFromNotificationData(data);
}
