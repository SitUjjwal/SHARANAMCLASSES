/**
 * Public platform config — branding + social links (no auth).
 */
import type { ApiSuccessResponse, PublicPlatformConfig } from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchPublicPlatform(): Promise<PublicPlatformConfig> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicPlatformConfig>>(
    '/public/platform',
  );
  return data.data;
}
