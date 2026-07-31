/**
 * Dashboard API — Home screen aggregate.
 * Why: one authenticated GET powers greeting, banners, categories, courses, updates.
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, DashboardPayload } from '@sharanam/shared';

export async function fetchDashboard(): Promise<DashboardPayload> {
  const { data } = await apiClient.get<ApiSuccessResponse<DashboardPayload>>('/dashboard');
  return data.data;
}
