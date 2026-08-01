/**
 * Student Test Analytics API.
 */
import { apiClient } from '@/api/client';
import type { ApiSuccessResponse, StudentTestAnalytics } from '@sharanam/shared';

export async function fetchStudentAnalytics(): Promise<StudentTestAnalytics> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentTestAnalytics>>(
    '/student/analytics',
  );
  return data.data;
}
