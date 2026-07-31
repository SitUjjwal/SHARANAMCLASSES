/**
 * myCourse.service.ts (mobile) — My Courses API client.
 */
import type { ApiSuccessResponse, MyCourseItem, MyCoursesPage } from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchMyCourses(search = ''): Promise<MyCoursesPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyCoursesPage>>('/my-courses', {
    params: search.trim() ? { search: search.trim() } : undefined,
  });
  return data.data;
}

export async function updateLastWatchedChapter(
  courseId: string,
  chapterId: string,
): Promise<MyCourseItem> {
  const { data } = await apiClient.patch<ApiSuccessResponse<MyCourseItem>>(
    `/my-courses/${courseId}/last-watched`,
    { chapter_id: chapterId },
  );
  return data.data;
}
