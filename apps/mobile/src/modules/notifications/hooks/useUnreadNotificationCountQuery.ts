import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchUnreadNotificationCount } from '@/modules/notifications/notification.service';

export function useUnreadNotificationCountQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount,
    queryFn: fetchUnreadNotificationCount,
    enabled,
    refetchInterval: 60_000,
  });
}
