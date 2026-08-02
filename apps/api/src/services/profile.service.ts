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
  avatar_url: string | null;
  avatar_storage_key: string | null;
  created_at: string;
  updated_at: string;
};

const PROFILE_COLUMNS =
  'id, full_name, email, phone_number, class_level, medium, avatar_url, avatar_storage_key, created_at, updated_at';

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
 * When avatar_storage_key changes, the previous R2 object is deleted (best-effort).
 */
export async function updateProfileByUserId(
  userId: string,
  input: UpdateProfileInput,
): Promise<StudentProfile> {
  const existing = await getProfileByUserId(userId);
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

  const next = data as StudentProfile;
  const oldKey = existing.avatar_storage_key;
  const newKey =
    input.avatar_storage_key !== undefined
      ? input.avatar_storage_key
      : next.avatar_storage_key;

  if (oldKey && oldKey !== newKey) {
    if (oldKey.startsWith('supabase:')) {
      const objectPath = oldKey.slice('supabase:'.length);
      const { error: removeError } = await supabase.storage
        .from('course-thumbnails')
        .remove([objectPath]);
      if (removeError) {
        console.warn('[profile] avatar delete failed', objectPath, removeError.message);
      }
    } else {
      const { deleteR2Object } = await import('../integrations/r2/client');
      await deleteR2Object(oldKey);
    }
  }

  return next;
}
