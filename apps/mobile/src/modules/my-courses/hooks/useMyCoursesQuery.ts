/**
 * useMyCoursesQuery — cached My Courses list (owned / purchased).
 * staleTime keeps tab snappy; search is part of the query key.
 */
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchMyCourses } from '@/services/myCourse.service';

export function useMyCoursesQuery(search: string) {
  return useQuery({
    queryKey: queryKeys.myCourses(search.trim()),
    queryFn: () => fetchMyCourses(search),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
