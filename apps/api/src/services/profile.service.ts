/**
 * Profile service — business/data access for student profiles.
 *
 * Controllers call these functions; they never talk to Supabase directly.
 */
import { getSupabaseAdmin } from '../config/supabase';
import type { UpdateProfileInput } from '../validators/profile.validators';
import { AppError } from '../utils/AppError';

export type StudentProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: string;
  medium: string;
  created_at: string;
  updated_at: string;
};

const PROFILE_COLUMNS =
  'id, full_name, email, phone_number, class_level, medium, created_at, updated_at';

/**
 * getProfileByUserId
 * READ — fetch the authenticated user's profile row.
 */
export async function getProfileByUserId(userId: string): Promise<StudentProfile> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'PROFILE_LOOKUP_FAILED', error.message, {
      code: error.code,
      details: error.details,
    });
  }

  if (!data) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found for this user');
  }

  return data as StudentProfile;
}

/**
 * updateProfileByUserId
 * UPDATE — patch allowed profile fields for the authenticated user only.
 */
export async function updateProfileByUserId(
  userId: string,
  input: UpdateProfileInput,
): Promise<StudentProfile> {
  // Ensure the profile exists before updating (clear 404 vs empty update)
  await getProfileByUserId(userId);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'PROFILE_UPDATE_FAILED', error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  if (!data) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found for this user');
  }

  return data as StudentProfile;
}
