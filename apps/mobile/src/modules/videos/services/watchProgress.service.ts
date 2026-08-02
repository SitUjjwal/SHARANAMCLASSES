/**
 * Continue Watching API — save / restore video playback position.
 */
import type {
  ApiSuccessResponse,
  ContinueWatchingItem,
  UpsertVideoWatchProgressInput,
  VideoWatchProgress,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchVideoWatchProgress(
  videoId: string,
): Promise<VideoWatchProgress | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<VideoWatchProgress | null>>(
    `/videos/${videoId}/progress`,
  );
  return data.data;
}

export async function saveVideoWatchProgress(
  videoId: string,
  input: UpsertVideoWatchProgressInput,
): Promise<VideoWatchProgress> {
  const { data } = await apiClient.put<ApiSuccessResponse<VideoWatchProgress>>(
    `/videos/${videoId}/progress`,
    input,
  );
  return data.data;
}

export async function fetchContinueWatching(): Promise<ContinueWatchingItem | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<ContinueWatchingItem | null>>(
    '/continue-watching',
  );
  return data.data;
}
