/**
 * Leaderboard API — top 100 scored attempts.
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, LeaderboardPage } from '@sharanam/shared';

export type LeaderboardFilters = {
  courseId?: string;
  testId?: string;
  date?: string;
  limit?: number;
};

export async function fetchLeaderboard(
  filters: LeaderboardFilters = {},
): Promise<LeaderboardPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<LeaderboardPage>>(
    '/student/leaderboard',
    {
      params: {
        courseId: filters.courseId || undefined,
        testId: filters.testId || undefined,
        date: filters.date || undefined,
        limit: filters.limit ?? 100,
      },
    },
  );
  return data.data;
}
