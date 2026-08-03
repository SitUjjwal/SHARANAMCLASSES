/**
 * Public platform branding (unauthenticated-safe).
 */
import type { PublicPlatformConfig } from '@sharanam/shared';

import { apiBaseUrl, ApiClientError } from '@/services/api';

export async function fetchPublicPlatform(): Promise<PublicPlatformConfig> {
  if (!apiBaseUrl) {
    throw new ApiClientError(500, 'CONFIG', 'VITE_API_BASE_URL is not set');
  }
  const response = await fetch(`${apiBaseUrl}/public/platform`);
  const json = (await response.json().catch(() => null)) as
    | { success: true; data: PublicPlatformConfig }
    | { success: false; error?: { code?: string; message?: string } }
    | null;

  if (!response.ok || !json || json.success !== true) {
    const err = json && 'error' in json ? json.error : undefined;
    throw new ApiClientError(
      response.status,
      err?.code ?? 'REQUEST_FAILED',
      err?.message ?? `Request failed (${response.status})`,
    );
  }

  return json.data;
}
