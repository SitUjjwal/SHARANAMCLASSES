/**
 * Health service.
 * Why: isolate network calls from UI screens.
 * Future: add courses.service.ts / auth.service.ts using the same pattern.
 */
import { apiClient } from '@/api/client';

export type HealthResponse = {
  status: string;
};

/** GET /health — verifies backend availability. */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}
