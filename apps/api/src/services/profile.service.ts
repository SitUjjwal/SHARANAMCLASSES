/**
 * Profile service — business/data access for student profiles.
 *
 * Controllers call these functions; they never talk to Supabase directly.
 */
import type { User } from '@supabase/supabase-js';

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

const CLASS_LEVELS = new Set([
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'competitive',
  'computer',
]);

function metaString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveClassLevel(raw: string | null): string {
  if (raw && CLASS_LEVELS.has(raw)) return raw;
  return '10';
}

function resolveMedium(raw: string | null): 'hindi' | 'english' {
  return raw === 'english' ? 'english' : 'hindi';
}

/**
 * ensureProfileForUser
 * Creates a profiles row when Auth exists but the row is missing
 * (trigger skipped, old accounts, email-confirm path without client insert).
 */
export async function ensureProfileForUser(user: User): Promise<StudentProfile> {
  try {
    return await getProfileByUserId(user.id);
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== 'PROFILE_NOT_FOUND') {
      throw error;
    }
  }

  const supabase = getSupabaseAdmin();
  const fullName =
    metaString(user, 'full_name') ||
    metaString(user, 'name') ||
    (user.email ? user.email.split('@')[0] : null) ||
    'Student';
  const email = (user.email ?? '').trim().toLowerCase() || `${user.id}@unknown.local`;
  const phoneNumber = metaString(user, 'phone_number') || '0000000000';
  const classLevel = resolveClassLevel(metaString(user, 'class_level'));
  const medium = resolveMedium(metaString(user, 'medium'));

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      class_level: classLevel,
      medium,
      role: 'student',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (upsertError) {
    // Unique email conflict — retry with a unique email suffix
    if (upsertError.code === '23505') {
      const { error: retryError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: fullName,
          email: `${user.id.slice(0, 8)}.${email}`,
          phone_number: phoneNumber,
          class_level: classLevel,
          medium,
          role: 'student',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (retryError) {
        throw new AppError(500, 'PROFILE_BOOTSTRAP_FAILED', retryError.message);
      }
    } else {
      throw new AppError(500, 'PROFILE_BOOTSTRAP_FAILED', upsertError.message);
    }
  }

  console.warn('[profile] bootstrapped missing profiles row for', user.id);
  return getProfileByUserId(user.id);
}

/**
 * getProfileByUserId
 * READ — fetch the authenticated user's profile row.
 * Falls back if avatar columns are not migrated yet.
 */
export async function getProfileByUserId(userId: string): Promise<StudentProfile> {
  const supabase = getSupabaseAdmin();

  const primary = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (!primary.error && primary.data) {
    return normalizeProfile(primary.data as Record<string, unknown>);
  }

  const missingAvatarColumn =
    primary.error &&
    /avatar_url|avatar_storage_key/i.test(primary.error.message);

  if (missingAvatarColumn) {
    console.warn(
      '[profile] avatar columns missing — apply migrations 20260802180000 / 20260802190000',
      primary.error.message,
    );
    const fallback = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, phone_number, class_level, medium, created_at, updated_at',
      )
      .eq('id', userId)
      .maybeSingle();

    if (fallback.error) {
      throw new AppError(500, 'PROFILE_LOOKUP_FAILED', fallback.error.message, {
        code: fallback.error.code,
        details: fallback.error.details,
      });
    }
    if (!fallback.data) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found for this user');
    }
    return normalizeProfile(fallback.data as Record<string, unknown>);
  }

  if (primary.error) {
    throw new AppError(500, 'PROFILE_LOOKUP_FAILED', primary.error.message, {
      code: primary.error.code,
      details: primary.error.details,
    });
  }

  throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found for this user');
}

function normalizeProfile(row: Record<string, unknown>): StudentProfile {
  return {
    id: row.id as string,
    full_name: (row.full_name as string) ?? '',
    email: (row.email as string) ?? '',
    phone_number: (row.phone_number as string) ?? '',
    class_level: (row.class_level as string) ?? '',
    medium: (row.medium as string) ?? '',
    avatar_url: (row.avatar_url as string | null | undefined) ?? null,
    avatar_storage_key:
      (row.avatar_storage_key as string | null | undefined) ?? null,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
  };
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

  const next = normalizeProfile(data as Record<string, unknown>);
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
