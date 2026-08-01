/**
 * useStudentTestsQuery — published tests list for TestListScreen.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchStudentTests } from '@/services/test.service';

export function useStudentTestsQuery(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.studentTests(courseId),
    queryFn: () => fetchStudentTests(courseId ? { courseId } : undefined),
    staleTime: 60_000,
  });
}
