/**
 * changePassword.service — verify current password, then rotate via Supabase Auth admin.
 * Passwords are never written to Postgres profiles.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type ChangePasswordParams = {
  userId: string;
  email: string;
  currentPassword: string;
  newPassword: string;
};

/**
 * Re-authenticates with the current password, then updates via admin API.
 */
export async function changePasswordForUser(
  params: ChangePasswordParams,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: params.email.trim().toLowerCase(),
    password: params.currentPassword,
  });

  if (verifyError) {
    throw new AppError(401, 'WRONG_PASSWORD', 'Current password is incorrect.');
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    params.userId,
    { password: params.newPassword },
  );

  if (updateError) {
    const lower = updateError.message.toLowerCase();
    if (lower.includes('same password') || lower.includes('different from the old')) {
      throw new AppError(
        400,
        'SAME_PASSWORD',
        'Choose a password that is different from your current one.',
      );
    }
    if (lower.includes('weak') || lower.includes('password should')) {
      throw new AppError(
        400,
        'WEAK_PASSWORD',
        'Password is too weak. Use 8+ characters with upper, lower, number, and a symbol.',
      );
    }
    throw new AppError(400, 'PASSWORD_UPDATE_FAILED', updateError.message);
  }
}
