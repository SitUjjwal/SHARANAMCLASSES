/**
 * useProfileOverviewQuery — caches Student Profile hub payload.
 * staleTime 5m so returning to the Profile tab feels instant.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchProfileOverview } from '@/modules/profile/services/profileService';
import { getApiErrorMessage } from '@/utils/apiErrors';

export function useProfileOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.profileOverview,
    queryFn: async () => {
      try {
        return await fetchProfileOverview();
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Could not load profile'));
      }
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
