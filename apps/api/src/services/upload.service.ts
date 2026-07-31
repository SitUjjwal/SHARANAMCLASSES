/**
 * Upload helpers — course thumbnails + chapter materials → Supabase Storage.
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const THUMB_BUCKET = 'course-thumbnails';
const MATERIAL_BUCKET = 'chapter-materials';
const THUMB_ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MATERIAL_ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const THUMB_MAX = 5 * 1024 * 1024;
const MATERIAL_MAX = 20 * 1024 * 1024;

function extensionFor(mimetype: string, originalname: string): string {
  const fromName = path.extname(originalname).replace('.', '').toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('wordprocessingml')) return 'docx';
  if (mimetype === 'application/msword') return 'doc';
  if (mimetype === 'text/plain') return 'txt';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/webp') return 'webp';
  if (mimetype === 'image/gif') return 'gif';
  return 'jpg';
}

export async function uploadCourseThumbnail(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): Promise<string> {
  if (!THUMB_ALLOWED.has(file.mimetype)) {
    throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Use JPEG, PNG, WebP, or GIF');
  }
  if (file.size > THUMB_MAX) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Thumbnail must be 5MB or smaller');
  }

  const ext = extensionFor(file.mimetype, file.originalname);
  const objectPath = `courses/${Date.now()}-${randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(THUMB_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new AppError(
      500,
      'THUMBNAIL_UPLOAD_FAILED',
      error.message ||
        'Upload failed. Ensure the course-thumbnails Storage bucket exists in Supabase.',
    );
  }

  const { data } = supabase.storage.from(THUMB_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

/** PDF / DOC / TXT / image for chapter notes & materials */
export async function uploadChapterMaterial(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): Promise<string> {
  if (!MATERIAL_ALLOWED.has(file.mimetype)) {
    throw new AppError(
      400,
      'INVALID_FILE_TYPE',
      'Upload PDF, DOC, DOCX, TXT, or image (JPEG/PNG/WebP)',
    );
  }
  if (file.size > MATERIAL_MAX) {
    throw new AppError(400, 'FILE_TOO_LARGE', 'File must be 20MB or smaller');
  }

  const ext = extensionFor(file.mimetype, file.originalname);
  const objectPath = `chapters/${Date.now()}-${randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(MATERIAL_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new AppError(
      500,
      'MATERIAL_UPLOAD_FAILED',
      error.message ||
        'Upload failed. Run migration 20260731130000_chapter_materials_bucket.sql in Supabase.',
    );
  }

  const { data } = supabase.storage.from(MATERIAL_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
