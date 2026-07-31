/**
 * Banner API — active list for the app + typed responses.
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, Banner } from '@sharanam/shared';

export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Banner[]>>('/banners');
  return data.data;
}
