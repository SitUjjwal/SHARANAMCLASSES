/**
 * Student live-classes API — GET /live-classes/public (paginated)
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, LiveClassesPublicPage } from '@sharanam/shared';

export async function fetchPublicLiveClassesPage(params?: {
  courseId?: string;
  page?: number;
  pageSize?: number;
}): Promise<LiveClassesPublicPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<LiveClassesPublicPage>>(
    '/live-classes/public',
    {
      params: {
        courseId: params?.courseId,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
    },
  );
  return data.data;
}

/** Convenience: first page items (home widgets / small lists). */
export async function fetchPublicLiveClasses(courseId?: string) {
  const page = await fetchPublicLiveClassesPage({
    courseId,
    page: 1,
    pageSize: 50,
  });
  return page.items;
}
