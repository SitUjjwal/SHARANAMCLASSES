/**
 * Student live-classes API — GET /live-classes/public
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, LiveClassPublic } from '@sharanam/shared';

export async function fetchPublicLiveClasses(courseId?: string): Promise<LiveClassPublic[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<LiveClassPublic[]>>(
    '/live-classes/public',
    {
      params: courseId ? { courseId } : undefined,
    },
  );
  return data.data;
}
