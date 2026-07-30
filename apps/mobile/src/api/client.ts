/**
 * Shared Axios API client.
 * Why: one configured HTTP client so every service uses the same base URL/timeouts.
 * Future: attach auth tokens in request interceptors after login module.
 */
import { create } from 'axios';

import { env } from '@/constants/env';

export const apiClient = create({
  // From EXPO_PUBLIC_API_BASE_URL (use LAN IP for physical devices)
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
