/**
 * Course catalog API — paginated list, detail, enroll.
 */
import { apiClient } from '@/api/client';
import type {
  ApiSuccessResponse,
  CourseDetail,
  CourseListFilters,
  CourseListPage,
} from '@sharanam/shared';

export type FetchCoursesParams = CourseListFilters;

export async function fetchCoursesPage(
  filters: FetchCoursesParams = {},
): Promise<CourseListPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseListPage>>('/courses', {
    params: {
      search: filters.search?.trim() || undefined,
      categoryId: filters.categoryId,
      featured:
        filters.featured === undefined ? undefined : String(filters.featured),
      classLevel: filters.classLevel,
      medium: filters.medium,
      price: filters.price && filters.price !== 'all' ? filters.price : undefined,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    },
  });
  return data.data;
}

export async function fetchCourseDetail(courseId: string): Promise<CourseDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseDetail>>(
    `/courses/${courseId}`,
  );
  return data.data;
}

export async function enrollInCourse(
  courseId: string,
): Promise<{ course_id: string; enrolled_at: string }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ course_id: string; enrolled_at: string }>
  >(`/courses/${courseId}/enroll`);
  return data.data;
}
