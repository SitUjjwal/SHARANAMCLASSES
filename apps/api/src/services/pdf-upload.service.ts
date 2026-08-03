/**
 * PDF upload helpers — secure validate → Cloudflare R2 (or Supabase fallback in local/dev).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { env, isR2Configured } from '../config/env';
import { deleteR2Object, securePutToR2 } from '../integrations/r2/client';
import { buildContentAddressedKey, UPLOAD_PROFILES, validateSecureUpload } from '../integrations/r2/fileSecurity';
import { AppError } from '../utils/AppError';

export type UploadedPdfMeta = {
  file_url: string;
  signed_url?: string;
  signed_url_expires_at?: string;
  storage_key: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  content_hash: string;
  deduplicated: boolean;
  storage_provider: 'r2' | 'supabase';
};

/**
 * Upload a PDF binary.
 * Production: Cloudflare R2 (content-addressed key, dedupe, signed URL).
 * Local/dev without R2: Supabase chapter-materials bucket (compat).
 */
export async function uploadPdfFile(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): Promise<UploadedPdfMeta> {
  const validated = validateSecureUpload(file, UPLOAD_PROFILES.pdf);

  if (isR2Configured()) {
    const uploaded = await securePutToR2({
      file,
      kind: 'pdf',
      prefix: 'pdfs',
      cacheControl: 'private, max-age=3600',
    });
    return {
      file_url: uploaded.file_url,
      signed_url: uploaded.signed_url,
      signed_url_expires_at: uploaded.signed_url_expires_at,
      storage_key: uploaded.storage_key,
      file_size: validated.byteLength,
      mime_type: validated.mimeType,
      original_filename: validated.displayName,
      content_hash: validated.contentHash,
      deduplicated: Boolean(uploaded.deduplicated),
      storage_provider: 'r2',
    };
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError(503, 'R2_NOT_CONFIGURED', 'Cloudflare R2 is required for PDF uploads');
  }

  console.warn(
    '[upload] R2 not configured — storing PDF in Supabase chapter-materials (dev fallback)',
  );

  const objectKey = buildContentAddressedKey('pdfs', validated.contentHash, validated.extension);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from('chapter-materials')
    .upload(objectKey, validated.buffer, {
      contentType: validated.mimeType,
      upsert: false,
    });

  if (error) {
    // Duplicate path in Supabase — treat as success if object already exists
    const msg = error.message.toLowerCase();
    if (!msg.includes('already exists') && !msg.includes('duplicate')) {
      throw new AppError(
        500,
        'PDF_UPLOAD_FAILED',
        error.message ||
          'PDF upload failed. Configure Cloudflare R2, or ensure chapter-materials bucket exists.',
      );
    }
  }

  const { data } = supabase.storage.from('chapter-materials').getPublicUrl(objectKey);
  return {
    file_url: data.publicUrl,
    storage_key: `supabase:${objectKey}`,
    file_size: validated.byteLength,
    mime_type: validated.mimeType,
    original_filename: validated.displayName,
    content_hash: validated.contentHash,
    deduplicated: Boolean(error),
    storage_provider: 'supabase',
  };
}

/** Best-effort delete of previous object when replacing / deleting a PDF row. */
export async function deletePdfStorageObject(storageKey: string): Promise<void> {
  if (!storageKey) return;

  if (storageKey.startsWith('supabase:')) {
    const objectPath = storageKey.slice('supabase:'.length);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from('chapter-materials').remove([objectPath]);
    if (error) {
      console.warn('[upload] supabase pdf delete failed', objectPath, error.message);
    }
    return;
  }

  await deleteR2Object(storageKey);
}
