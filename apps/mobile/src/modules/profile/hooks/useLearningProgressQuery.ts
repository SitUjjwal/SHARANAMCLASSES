/**
 * useLearningProgressQuery — caches GET /progress.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchLearningProgress } from '@/modules/profile/services/progressService';

export function useLearningProgressQuery() {
  return useQuery({
    queryKey: queryKeys.learningProgress,
    queryFn: fetchLearningProgress,
    staleTime: 60_000,
    gcTime: 15 * 60_000,
  });
}
