/**
 * Admin insights API — results, leaderboard, analytics.
 */
import type {
  LeaderboardPage,
  StudentTestAnalytics,
  TestAttemptResultSummary,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type AdminResultRow = TestAttemptResultSummary & {
  student_name: string;
  user_id: string;
};

export type AdminResultsPage = {
  items: AdminResultRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export async function fetchAdminResults(params: {
  page?: number;
  pageSize?: number;
}): Promise<AdminResultsPage> {
  return apiRequest<AdminResultsPage>('/admin/results', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  });
}

export async function fetchAdminLeaderboard(params: {
  courseId?: string;
  testId?: string;
  date?: string;
  limit?: number;
}): Promise<LeaderboardPage> {
  return apiRequest<LeaderboardPage>('/leaderboard', {
    params: {
      courseId: params.courseId,
      testId: params.testId,
      date: params.date,
      limit: params.limit ?? 100,
    },
  });
}

export async function fetchAdminAnalytics(): Promise<StudentTestAnalytics> {
  return apiRequest<StudentTestAnalytics>('/admin/analytics');
}
