/**
 * Profile avatar upload — image binary → Cloudflare R2 (Supabase fallback in local/dev).
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { ProfileAvatarUploadResult } from '@sharanam/shared';

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { putR2Object } from '../integrations/r2/client';
import { AppError } from '../utils/AppError';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;
const FALLBACK_BUCKET = 'course-thumbnails';

function extensionFor(mimetype: string, originalname: string): string {
  const fromName = path.extname(originalname).replace('.', '').toLowerCase();
  if (fromName === 'jpg' || fromName === 'jpeg' || fromName === 'png' || fromName === 'webp') {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/webp') return 'webp';
  return 'jpg';
}

function assertAvatarImage(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): void {
  if (!ALLOWED.has(file.mimetype)) {
    throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Use JPEG, PNG, or WebP for profile photos');
  }
  if (file.size <= 0) {
    throw new AppError(400, 'EMPTY_IMAGE', 'Image file is empty');
  }
  if (file.size > MAX_BYTES) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Profile photo must be 5MB or smaller');
  }
}

/**
 * uploadProfileAvatar
 * Stores binary in R2 under avatars/{userId}/… and returns public URL + key.
 * Does NOT write Supabase — caller PATCHes avatar_url + avatar_storage_key.
 */
export async function uploadProfileAvatar(
  userId: string,
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  },
): Promise<ProfileAvatarUploadResult> {
  assertAvatarImage(file);

  const ext = extensionFor(file.mimetype, file.originalname);
  const objectKey = `avatars/${userId}/${Date.now()}-${randomUUID()}.${ext}`;

  if (isR2Configured()) {
    const uploaded = await putR2Object({
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
      cacheControl: 'public, max-age=86400',
    });
    return {
      avatar_url: uploaded.file_url,
      avatar_storage_key: uploaded.storage_key,
    };
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError(
      503,
      'R2_NOT_CONFIGURED',
      'Cloudflare R2 is required for profile photo uploads',
    );
  }

  console.warn(
    '[upload] R2 not configured — storing avatar in Supabase course-thumbnails (dev fallback)',
  );

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(FALLBACK_BUCKET).upload(objectKey, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new AppError(
      500,
      'AVATAR_UPLOAD_FAILED',
      error.message ||
        'Avatar upload failed. Configure Cloudflare R2, or ensure course-thumbnails bucket exists.',
    );
  }

  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(objectKey);
  return {
    avatar_url: data.publicUrl,
    avatar_storage_key: `supabase:${objectKey}`,
  };
}
