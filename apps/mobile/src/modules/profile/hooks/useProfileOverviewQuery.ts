/**
 * useProfileOverviewQuery — caches Student Profile hub payload.
 * staleTime 5m so returning to the Profile tab feels instant.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchProfileOverview } from '@/modules/profile/services/profileService';

export function useProfileOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.profileOverview,
    queryFn: fetchProfileOverview,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
