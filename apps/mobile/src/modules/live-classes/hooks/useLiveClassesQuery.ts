/**
 * useLiveClassesQuery — first pages flattened (home / widgets).
 * Prefer useLiveClassesInfiniteQuery on the Live Classes screen.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchPublicLiveClasses } from '@/services/liveClass.service';

export function useLiveClassesQuery() {
  return useQuery({
    queryKey: queryKeys.liveClasses({ mode: 'all' }),
    queryFn: () => fetchPublicLiveClasses(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
