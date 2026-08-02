/**
 * useTestHistoryQuery — cached GET /test-history for Test History screen.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchTestHistory } from '@/modules/profile/services/testHistoryService';

export function useTestHistoryQuery(page = 1) {
  return useQuery({
    queryKey: queryKeys.testHistory(page),
    queryFn: () => fetchTestHistory(page, 50),
    staleTime: 60_000,
  });
}
