import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Server-side Supabase client (service role).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to mobile/admin clients.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const url = env.SUPABASE_URL?.trim();
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
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdmin;
}
