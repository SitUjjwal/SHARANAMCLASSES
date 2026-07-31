/**
 * PDF upload helpers — validate → Cloudflare R2 (or Supabase fallback in local/dev).
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { getSupabaseAdmin } from '../config/supabase';
import { env, isR2Configured } from '../config/env';
import { deleteR2Object, putR2Object } from '../integrations/r2/client';
import { AppError } from '../utils/AppError';

const PDF_MIME = 'application/pdf';
const PDF_MAX = 25 * 1024 * 1024; // 25MB
const PDF_MAGIC = Buffer.from('%PDF');

export type UploadedPdfMeta = {
  file_url: string;
  storage_key: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  storage_provider: 'r2' | 'supabase';
};

function sanitizeFilename(name: string): string {
  const base = path.basename(name || 'document.pdf');
  return base.replace(/[^\w.\-() ]+/g, '_').slice(0, 180) || 'document.pdf';
}

function assertPdfFile(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): void {
  if (file.mimetype !== PDF_MIME) {
    throw new AppError(400, 'INVALID_PDF_TYPE', 'Only PDF files (application/pdf) are allowed');
  }
  if (file.size <= 0) {
    throw new AppError(400, 'EMPTY_PDF', 'PDF file is empty');
  }
  if (file.size > PDF_MAX) {
    throw new AppError(400, 'PDF_TOO_LARGE', 'PDF must be 25MB or smaller');
  }
  if (file.buffer.length < 5 || !file.buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    throw new AppError(
      400,
      'INVALID_PDF_CONTENT',
      'File content is not a valid PDF (missing %PDF header)',
    );
  }
  const lower = file.originalname.toLowerCase();
  if (lower && !lower.endsWith('.pdf')) {
    throw new AppError(400, 'INVALID_PDF_EXTENSION', 'Filename must end with .pdf');
  }
}

/**
 * Upload a PDF binary.
 * Production: Cloudflare R2.
 * Local/dev without R2: Supabase chapter-materials bucket (compat).
 */
export async function uploadPdfFile(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): Promise<UploadedPdfMeta> {
  assertPdfFile(file);

  const original_filename = sanitizeFilename(file.originalname);
  const objectKey = `pdfs/${Date.now()}-${randomUUID()}.pdf`;

  if (isR2Configured()) {
    const uploaded = await putR2Object({
      key: objectKey,
      body: file.buffer,
      contentType: PDF_MIME,
    });
    return {
      file_url: uploaded.file_url,
      storage_key: uploaded.storage_key,
      file_size: file.size,
      mime_type: PDF_MIME,
      original_filename,
      storage_provider: 'r2',
    };
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError(503, 'R2_NOT_CONFIGURED', 'Cloudflare R2 is required for PDF uploads');
  }

  console.warn(
    '[upload] R2 not configured — storing PDF in Supabase chapter-materials (dev fallback)',
  );

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from('chapter-materials')
    .upload(objectKey, file.buffer, {
      contentType: PDF_MIME,
      upsert: false,
    });

  if (error) {
    throw new AppError(
      500,
      'PDF_UPLOAD_FAILED',
      error.message ||
        'PDF upload failed. Configure Cloudflare R2, or ensure chapter-materials bucket exists.',
    );
  }

  const { data } = supabase.storage.from('chapter-materials').getPublicUrl(objectKey);
  return {
    file_url: data.publicUrl,
    storage_key: `supabase:${objectKey}`,
    file_size: file.size,
    mime_type: PDF_MIME,
    original_filename,
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
