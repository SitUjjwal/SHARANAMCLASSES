/**
 * Supabase admin client (server-only).
 * Why: one secure place to create the service-role client.
 * Future: all DB/Auth admin operations import `getSupabaseAdmin()`.
 * Security: never send SUPABASE_SERVICE_ROLE_KEY to mobile/admin.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const url = env.SUPABASE_URL?.trim();
  // Supports legacy JWT service_role keys and newer `sb_secret_...` keys
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/api/.env',
    );
  }

  if (!url.startsWith('https://') || !url.includes('supabase.co')) {
    throw new Error(
      'SUPABASE_URL must be your project URL (e.g. https://xxxx.supabase.co), not an API key',
    );
  }

  supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: {
      // Server processes should not store browser-like sessions
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdmin;
}
