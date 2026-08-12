/**
 * useBatchSubjectChaptersQuery — GET /student/batch-subjects/:id/chapters.
 * Same Chapter shape (lock flags, counts) as the course chapters endpoint.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchBatchSubjectChapters } from '@/services/subject.service';

export function useBatchSubjectChaptersQuery(
  batchSubjectId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.batchSubjectChapters(batchSubjectId ?? ''),
    queryFn: () => fetchBatchSubjectChapters(batchSubjectId ?? ''),
    enabled: Boolean(batchSubjectId),
  });
}
