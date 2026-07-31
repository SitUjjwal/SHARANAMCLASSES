/**
 * Detail query — separate cache key from the infinite list.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchCourseDetail } from '@/services/course.service';

export function useCourseDetailQuery(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseDetail(courseId),
    queryFn: () => fetchCourseDetail(courseId),
    enabled: Boolean(courseId),
  });
}
