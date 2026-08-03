/**
 * Authenticated API client for @sharanam/api.
 */
import type { ApiSuccessResponse } from '@sharanam/shared';

import { supabase } from '@/lib/supabase';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  '',
);

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  params?: Record<string, string | number | undefined | null>;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiClientError(500, 'CONFIG', 'VITE_API_BASE_URL is not set');
  }

  const token = await getAccessToken();
  const url = new URL(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body,
    cache: 'no-store',
  });

  const json = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
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

export { apiBaseUrl };
