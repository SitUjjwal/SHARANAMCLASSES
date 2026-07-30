import { create } from 'axios';

import { env } from '@/constants/env';

/**
 * Shared Axios client — base URL from EXPO_PUBLIC_API_BASE_URL.
 */
export const apiClient = create({
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
