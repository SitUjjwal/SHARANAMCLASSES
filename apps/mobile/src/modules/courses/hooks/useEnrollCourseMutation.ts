/**
 * Enroll / buy mutation — invalidates detail, list, and dashboard caches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { enrollInCourse } from '@/services/course.service';

export function useEnrollCourseMutation(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courseDetail(courseId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chapters(courseId) }),
        queryClient.invalidateQueries({ queryKey: ['courses', 'list'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
      ]);
    },
  });
}
