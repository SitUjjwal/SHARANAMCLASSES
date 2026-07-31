/**
 * useDashboardQuery — loads Home Dashboard via React Query.
 * Why: caching, retry, loading/error states for the whole home feed.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchDashboard } from '@/services/dashboard.service';

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
  });
}
