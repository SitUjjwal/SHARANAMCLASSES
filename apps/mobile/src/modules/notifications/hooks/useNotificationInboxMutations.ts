/**
 * Mark read / delete / mark-all — invalidate inbox + badge caches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/modules/notifications/notification.service';

function invalidateInbox(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationHistory });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => invalidateInbox(queryClient),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateInbox(queryClient),
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => invalidateInbox(queryClient),
  });
}
