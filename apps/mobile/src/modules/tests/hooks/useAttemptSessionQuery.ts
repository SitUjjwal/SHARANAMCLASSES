/**
 * useAttemptSessionQuery — load full Test Screen payload by attempt id.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchAttemptSession } from '@/services/test.service';

export function useAttemptSessionQuery(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.attemptSession(attemptId),
    queryFn: () => fetchAttemptSession(attemptId),
    enabled: Boolean(attemptId),
    staleTime: 30_000,
  });
}
