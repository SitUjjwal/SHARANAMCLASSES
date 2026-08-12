/**
 * useBatchSubjectsQuery — GET /student/batches/:batchId/subjects.
 * Empty array = legacy course without subjects.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchBatchSubjects } from '@/services/subject.service';

export function useBatchSubjectsQuery(batchId: string) {
  return useQuery({
    queryKey: queryKeys.batchSubjects(batchId),
    queryFn: () => fetchBatchSubjects(batchId),
    enabled: Boolean(batchId),
  });
}
