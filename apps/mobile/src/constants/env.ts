/**
 * Typed public env for the mobile app.
 * Why: centralize EXPO_PUBLIC_* reads; fail clearly when required values are missing.
 * Future: Razorpay public key, feature flags, etc.
 */
import Constants from 'expo-constants';

function required(name: string, value: string | undefined, fallback?: string): string {
  if (value && value.length > 0) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

function expoLanHost(): string | null {
  const constants = Constants as {
    expoGoConfig?: { debuggerHost?: string | null };
    expoConfig?: { hostUri?: string | null };
  };
  const hostUri =
    constants.expoGoConfig?.debuggerHost ?? constants.expoConfig?.hostUri ?? '';
  const match = String(hostUri).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match?.[1] ?? null;
}

function isRewritableDevHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)
  );
}

/**
 * Expo Go on a phone cannot reach localhost or a stale LAN IP from .env.
 * In development, point the API at the same PC IP Metro is using.
 */
function resolveApiBaseUrl(): string {
  const configured = required(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL,
    'http://localhost:4000',
  );
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  if (appEnv === 'production') {
    return configured;
  }
  const lanHost = expoLanHost();
  if (!lanHost) {
    return configured;
  }
  try {
    const url = new URL(configured);
    if (!isRewritableDevHost(url.hostname)) {
      return configured;
    }
    url.hostname = lanHost;
    return url.origin;
  } catch {
    return configured;
  }
}

export const env = {
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as
    | 'development'
    | 'staging'
    | 'production',
  apiBaseUrl: resolveApiBaseUrl(),
  supabaseUrl: required(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
} as const;
