/**
 * Infinite course list — pages cached under queryKeys.courses(filters).
 * Why: search/filter changes get a fresh cache entry; scroll appends pages.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { fetchCoursesPage } from '@/services/course.service';
import type { CourseListFilters } from '@sharanam/shared';

export type CourseListQueryFilters = Omit<CourseListFilters, 'page' | 'pageSize'> & {
  pageSize?: number;
};

export function useCourseListInfiniteQuery(filters: CourseListQueryFilters = {}) {
  const pageSize = filters.pageSize ?? 10;
  const stableFilters = {
    search: filters.search,
    categoryId: filters.categoryId,
    featured: filters.featured,
    classLevel: filters.classLevel,
    medium: filters.medium,
    price: filters.price,
  };

  return useInfiniteQuery({
    queryKey: queryKeys.courses({ ...stableFilters, pageSize }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCoursesPage({
        ...stableFilters,
        page: pageParam,
        pageSize,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}

