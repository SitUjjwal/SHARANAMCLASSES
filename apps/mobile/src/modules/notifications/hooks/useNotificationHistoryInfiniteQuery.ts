/**
 * Infinite Notification Center history — page cache under queryKeys.notificationHistory.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchNotificationHistoryPage } from '@/modules/notifications/notification.service';

const PAGE_SIZE = 20;

export function useNotificationHistoryInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.notificationHistory,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchNotificationHistoryPage({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}
