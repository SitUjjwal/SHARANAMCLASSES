/**
 * Auth domain types.
 * Why: keep UI/store typed without depending on full Supabase SDK shapes everywhere.
 */
import type { Session, User } from '@supabase/supabase-js';

export type AuthSession = Session;
export type AuthUser = User;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
