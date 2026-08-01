/**
 * useAnalyticsQuery — Test Series analytics dashboard payload.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchStudentAnalytics } from '@/services/analytics.service';

export function useAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.testAnalytics,
    queryFn: fetchStudentAnalytics,
    staleTime: 60_000,
  });
}
