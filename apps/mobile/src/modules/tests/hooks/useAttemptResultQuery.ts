/**
 * useAttemptResultQuery — scored result for Result / Review screens.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchAttemptResult } from '@/services/test.service';

export function useAttemptResultQuery(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.attemptResult(attemptId),
    queryFn: () => fetchAttemptResult(attemptId),
    enabled: Boolean(attemptId),
    staleTime: 60_000,
  });
}
