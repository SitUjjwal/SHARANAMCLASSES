/**
 * useLiveClassesInfiniteQuery — paginated live classes with React Query cache.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPublicLiveClassesPage } from '@/services/liveClass.service';

export function useLiveClassesInfiniteQuery(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: queryKeys.liveClasses({ pageSize }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPublicLiveClassesPage({ page: pageParam, pageSize }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
