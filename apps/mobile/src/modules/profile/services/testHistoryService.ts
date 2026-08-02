/**
 * fetchTestHistory — GET /test-history (paginated scored attempts).
 */
import type { ApiSuccessResponse, TestAttemptResultListPage } from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchTestHistory(
  page = 1,
  pageSize = 50,
): Promise<TestAttemptResultListPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<TestAttemptResultListPage>>(
    '/test-history',
    { params: { page, pageSize } },
  );
  return data.data;
}
