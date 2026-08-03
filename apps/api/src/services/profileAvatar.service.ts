/**
 * Profile avatar upload — secure image validate → Cloudflare R2 (Supabase fallback in local/dev).
 */
import type { ProfileAvatarUploadResult } from '@sharanam/shared';

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { securePutToR2 } from '../integrations/r2/client';
import {
  buildContentAddressedKey,
  UPLOAD_PROFILES,
  validateSecureUpload,
} from '../integrations/r2/fileSecurity';
import { AppError } from '../utils/AppError';

const FALLBACK_BUCKET = 'course-thumbnails';

/**
 * uploadProfileAvatar
 * Stores binary in R2 under avatars/{userId}/{sha256}.{ext} (deduped) and returns URL + key.
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
): Promise<ProfileAvatarUploadResult & { signed_url?: string; content_hash?: string }> {
  const validated = validateSecureUpload(file, UPLOAD_PROFILES.image);

  if (isR2Configured()) {
    const uploaded = await securePutToR2({
      file,
      kind: 'image',
      prefix: `avatars/${userId}`,
      cacheControl: 'public, max-age=86400',
      extraMetadata: { 'owner-user-id': userId },
    });
    return {
      avatar_url: uploaded.file_url,
      avatar_storage_key: uploaded.storage_key,
      signed_url: uploaded.signed_url,
      content_hash: validated.contentHash,
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

  const objectKey = buildContentAddressedKey(
    `avatars/${userId}`,
    validated.contentHash,
    validated.extension,
  );
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(FALLBACK_BUCKET).upload(objectKey, validated.buffer, {
    contentType: validated.mimeType,
    upsert: false,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (!msg.includes('already exists') && !msg.includes('duplicate')) {
      throw new AppError(
        500,
        'AVATAR_UPLOAD_FAILED',
        error.message ||
          'Avatar upload failed. Configure Cloudflare R2, or ensure course-thumbnails bucket exists.',
      );
    }
  }

  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(objectKey);
  return {
    avatar_url: data.publicUrl,
    avatar_storage_key: `supabase:${objectKey}`,
    content_hash: validated.contentHash,
  };
}
