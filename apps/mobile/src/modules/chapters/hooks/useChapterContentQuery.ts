/**
 * useChapterContentQuery — GET /courses/:id/chapters/:chapterId
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchChapterDetail } from '@/services/chapter.service';

export function useChapterContentQuery(courseId: string, chapterId: string) {
  return useQuery({
    queryKey: queryKeys.chapterDetail(courseId, chapterId),
    queryFn: () => fetchChapterDetail(courseId, chapterId),
    enabled: Boolean(courseId && chapterId),
  });
}
