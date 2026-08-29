/**
 * useChapterTestsQuery — GET /student/tests?courseId&chapterId
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchStudentTests } from '@/services/test.service';

export function useChapterTestsQuery(courseId: string, chapterId: string) {
  return useQuery({
    queryKey: queryKeys.chapterTests(courseId, chapterId),
    queryFn: () => fetchStudentTests({ courseId, chapterId }),
    enabled: Boolean(courseId && chapterId),
    staleTime: 60_000,
  });
}
