/**
 * useLeaderboardQuery — top 100 with course / test / date filters.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import {
  fetchLeaderboard,
  type LeaderboardFilters,
} from '@/services/leaderboard.service';

export function useLeaderboardQuery(filters: LeaderboardFilters) {
  return useQuery({
    queryKey: queryKeys.leaderboard(filters),
    queryFn: () => fetchLeaderboard(filters),
    staleTime: 30_000,
  });
}
