/**
 * Supabase browser client for admin auth (anon key only).
 */
import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabaseEnvOk = Boolean(url && anonKey);

if (!supabaseEnvOk) {
  console.error(
    '[admin] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'For Docker: set them in the repo root .env, then rebuild admin ' +
      '(docker compose build admin && docker compose up -d).',
  );
}

export const supabase = createClient(url ?? 'http://invalid.local', anonKey ?? 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
