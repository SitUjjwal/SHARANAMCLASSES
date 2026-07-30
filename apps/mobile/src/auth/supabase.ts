/**
 * Supabase browser/mobile client (anon key).
 * Why: all Auth calls go through one configured client with secure session persistence.
 * Future: realtime channels, storage downloads, RLS-backed reads.
 */
import { createClient } from '@supabase/supabase-js';

import { env } from '@/constants/env';

import { secureStorageAdapter } from './secureStorage';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
