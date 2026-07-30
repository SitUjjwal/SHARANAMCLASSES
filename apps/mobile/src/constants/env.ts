/**
 * Typed public env for the mobile app.
 * Why: centralize EXPO_PUBLIC_* reads; fail clearly when required values are missing.
 * Future: Razorpay public key, feature flags, etc.
 */
function required(name: string, value: string | undefined, fallback?: string): string {
  if (value && value.length > 0) {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as
    | 'development'
    | 'staging'
    | 'production',
  apiBaseUrl: required(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL,
    'http://localhost:4000',
  ),
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
