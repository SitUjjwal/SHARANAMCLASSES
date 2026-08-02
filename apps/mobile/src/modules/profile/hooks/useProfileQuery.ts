/**
 * useProfileQuery — caches GET /profile (identity fields only).
 * Used by Edit Profile; Profile hub prefers useProfileOverviewQuery.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchProfile } from '@/modules/profile/services/profileService';

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
