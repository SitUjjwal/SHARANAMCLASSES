/**
 * useLiveClassesQuery — student public live class list.
 * Refetches periodically so status flips upcoming → live without manual refresh.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPublicLiveClasses } from '@/services/liveClass.service';

export function useLiveClassesQuery() {
  return useQuery({
    queryKey: queryKeys.liveClasses(),
    queryFn: () => fetchPublicLiveClasses(),
    refetchInterval: 30_000,
  });
}
