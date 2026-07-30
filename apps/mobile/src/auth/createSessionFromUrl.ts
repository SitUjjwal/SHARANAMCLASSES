/**
 * Parse Supabase auth redirect deep links and establish a session.
 *
 * Supported paste / open URLs:
 * - sharanam://reset-password#access_token=…&refresh_token=…&type=recovery
 * - exp://…/--/reset-password#…
 * - https://….supabase.co/auth/v1/verify?token=…&type=recovery
 * - PKCE: ?code=…
 *
 * Expo Go often cannot open exp:// from the email client — pasting the
 * email link into the app is the reliable path during development.
 */
import * as Linking from 'expo-linking';

import { supabase } from '@/auth/supabase';

export type AuthRedirectParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  type?: string;
  token?: string;
  token_hash?: string;
  error?: string;
  error_description?: string;
};

/**
 * extractParamsFromUrl
 * Reads query string and hash fragment from a deep-link or verify URL.
 */
export function extractParamsFromUrl(url: string): AuthRedirectParams {
  const trimmed = url.trim();
  const parsed = Linking.parse(trimmed);
  const queryParams = (parsed.queryParams ?? {}) as Record<
    string,
    string | string[] | undefined
  >;

  const fromQuery: Record<string, string> = {};
  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === 'string') {
      fromQuery[key] = value;
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      fromQuery[key] = value[0];
    }
  }

  // Fallback for full https verify URLs (Linking.parse can miss some query shapes)
  try {
    const qIndex = trimmed.indexOf('?');
    if (qIndex >= 0) {
      const queryOnly = trimmed.slice(qIndex + 1).split('#')[0] ?? '';
      for (const part of queryOnly.split('&')) {
        const [rawKey, rawValue = ''] = part.split('=');
        if (!rawKey || fromQuery[rawKey]) {
          continue;
        }
        fromQuery[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
      }
    }
  } catch {
    // ignore parse failures — hash/query below may still work
  }

  const hashIndex = trimmed.indexOf('#');
  const fromHash: Record<string, string> = {};
  if (hashIndex >= 0) {
    const hash = trimmed.slice(hashIndex + 1);
    for (const part of hash.split('&')) {
      const [rawKey, rawValue = ''] = part.split('=');
      if (!rawKey) {
        continue;
      }
      fromHash[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    }
  }

  return {
    access_token: fromHash.access_token ?? fromQuery.access_token,
    refresh_token: fromHash.refresh_token ?? fromQuery.refresh_token,
    code: fromHash.code ?? fromQuery.code,
    type: fromHash.type ?? fromQuery.type,
    token: fromHash.token ?? fromQuery.token,
    token_hash: fromHash.token_hash ?? fromQuery.token_hash,
    error: fromHash.error ?? fromQuery.error,
    error_description: fromHash.error_description ?? fromQuery.error_description,
  };
}

/**
 * createSessionFromUrl
 * Exchanges tokens/code/verify link into a Supabase session.
 */
export async function createSessionFromUrl(url: string): Promise<{
  created: boolean;
  isRecovery: boolean;
}> {
  const params = extractParamsFromUrl(url);

  if (params.error) {
    throw new Error(params.error_description ?? params.error);
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      throw error;
    }
    return {
      created: true,
      isRecovery: params.type === 'recovery' || isResetPasswordUrl(url),
    };
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) {
      throw error;
    }
    return {
      created: true,
      isRecovery: params.type === 'recovery' || isResetPasswordUrl(url),
    };
  }

  // Email "verify" link pasted from inbox (works when Expo Go deep link fails)
  const tokenHash = params.token_hash ?? params.token;
  const otpType = params.type;
  if (
    tokenHash &&
    (otpType === 'recovery' ||
      otpType === 'magiclink' ||
      otpType === 'signup' ||
      otpType === 'email')
  ) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });
    if (error) {
      throw error;
    }
    return {
      created: true,
      isRecovery: otpType === 'recovery' || isResetPasswordUrl(url),
    };
  }

  return { created: false, isRecovery: false };
}

/**
 * isResetPasswordUrl
 * True when the deep link targets the reset-password path
 * (custom scheme or Expo Go `exp://…/--/reset-password`).
 */
export function isResetPasswordUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    normalized.includes('reset-password') ||
    normalized.includes('type=recovery') ||
    normalized.includes('type%3drecovery')
  );
}
