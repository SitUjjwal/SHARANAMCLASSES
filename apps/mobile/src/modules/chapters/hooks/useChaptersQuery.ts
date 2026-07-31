/**
 * useChaptersQuery — GET /courses/:id/chapters (with lock flags).
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchChapters } from '@/services/chapter.service';

export function useChaptersQuery(courseId: string) {
  return useQuery({
    queryKey: queryKeys.chapters(courseId),
    queryFn: () => fetchChapters(courseId),
    enabled: Boolean(courseId),
  });
}
