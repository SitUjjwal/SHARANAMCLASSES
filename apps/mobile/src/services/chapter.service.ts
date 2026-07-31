/**
 * Chapters API — list + chapter content detail.
 */
import { apiClient } from '@/api/client';
import type {
  ApiSuccessResponse,
  Chapter,
  ChapterDetail,
} from '@sharanam/shared';

export async function fetchChapters(courseId: string): Promise<Chapter[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Chapter[]>>(
    `/courses/${courseId}/chapters`,
  );
  return data.data;
}

export async function fetchChapterDetail(
  courseId: string,
  chapterId: string,
): Promise<ChapterDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<ChapterDetail>>(
    `/courses/${courseId}/chapters/${chapterId}`,
  );
  return data.data;
}
