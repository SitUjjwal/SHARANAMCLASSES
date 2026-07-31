/**
 * Returns true when profiles.role = admin, or email is in ADMIN_EMAILS.
 * Allowlisted emails are auto-promoted once so DB stays consistent.
 */
import { env } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function isAdminUser(
  userId: string,
  email?: string | null,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'PROFILE_LOOKUP_FAILED', error.message);
  }

  if (data?.role === 'admin') {
    return true;
  }

  const candidate = email ?? data?.email ?? null;
  if (!isAllowlistedEmail(candidate)) {
    return false;
  }

  // Bootstrap: promote allowlisted account so requireAdmin / UI stay in sync
  const { error: promoteError } = await supabase
    .from('profiles')
    .update({ role: 'admin', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (promoteError) {
    throw new AppError(500, 'ADMIN_PROMOTE_FAILED', promoteError.message);
  }

  return true;
}
