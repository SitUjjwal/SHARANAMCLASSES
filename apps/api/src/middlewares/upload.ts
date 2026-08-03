/**
 * Multer middleware — first gate (size + declared MIME + dangerous extension).
 * Content magic / metadata scan happens in integrations/r2/fileSecurity.ts after parse.
 */
import path from 'node:path';

import multer from 'multer';

import { DANGEROUS_EXTENSIONS } from '../integrations/r2/fileSecurity';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

function rejectDangerousName(originalname: string): void {
  const base = path.basename(originalname || '').toLowerCase();
  const parts = base.split('.').filter(Boolean);
  for (const part of parts.slice(1)) {
    if (DANGEROUS_EXTENSIONS.has(part)) {
      throw new AppError(
        400,
        'DANGEROUS_FILE_EXTENSION',
        `File extension .${part} is not allowed`,
      );
    }
  }
}

function makeFilter(allowed: (file: Express.Multer.File) => boolean, message: string, code: string) {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    try {
      rejectDangerousName(file.originalname);
      if (!allowed(file)) {
        cb(new AppError(400, code, message));
        return;
      }
      cb(null, true);
    } catch (err) {
      cb(err as Error);
    }
  };
}

export const thumbnailUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) =>
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp',
    'Only JPEG, PNG, or WebP uploads are allowed',
    'INVALID_IMAGE_TYPE',
  ),
}).single('thumbnail');

/** Banner Management upload — multipart field `image`. */
export const bannerImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) =>
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp',
    'Only JPEG, PNG, or WebP uploads are allowed',
    'INVALID_IMAGE_TYPE',
  ),
}).single('image');

/** Student profile photo — multipart field `image` (JPEG/PNG/WebP, max 5MB). */
export const profileAvatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) =>
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp',
    'Use JPEG, PNG, or WebP for profile photos',
    'INVALID_IMAGE_TYPE',
  ),
}).single('image');

/** Bug report screenshot — optional multipart field `screenshot` (JPEG/PNG/WebP, max 5MB). */
export const bugScreenshotUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) =>
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp',
    'Use JPEG, PNG, or WebP for screenshots',
    'INVALID_IMAGE_TYPE',
  ),
}).single('screenshot');

const MATERIAL_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const materialUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) => MATERIAL_MIME.has(file.mimetype),
    'Only PDF, DOC, DOCX, TXT, or image uploads are allowed',
    'INVALID_FILE_TYPE',
  ),
}).single('file');

/** Excel question bank import — .xlsx / .xls, max 5MB (parsed in memory, not stored on R2). */
const EXCEL_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

export const excelUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter((file) => {
    const name = file.originalname.toLowerCase();
    const okExt = name.endsWith('.xlsx') || name.endsWith('.xls');
    return okExt || EXCEL_MIME.has(file.mimetype);
  }, 'Only Excel uploads are allowed (.xlsx or .xls)', 'INVALID_EXCEL_TYPE'),
}).single('file');

/** Dedicated PDF catalog upload — application/pdf only, max 25MB */
export const pdfUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) => file.mimetype === 'application/pdf',
    'Only PDF uploads are allowed',
    'INVALID_PDF_TYPE',
  ),
}).single('file');

/** Platform logo — JPEG/PNG/WebP only (SVG rejected — XSS). Max 2MB. */
export const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: makeFilter(
    (file) =>
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp',
    'Use JPEG, PNG, or WebP for the logo (SVG is not allowed)',
    'INVALID_IMAGE_TYPE',
  ),
}).single('logo');
