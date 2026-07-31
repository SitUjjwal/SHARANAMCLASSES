/**
 * Multer middleware for thumbnail + chapter material + PDF uploads (memory).
 */
import multer from 'multer';

import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

export const thumbnailUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError(400, 'INVALID_IMAGE_TYPE', 'Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('thumbnail');

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
  fileFilter: (_req, file, cb) => {
    if (!MATERIAL_MIME.has(file.mimetype)) {
      cb(
        new AppError(
          400,
          'INVALID_FILE_TYPE',
          'Only PDF, DOC, DOCX, TXT, or image uploads are allowed',
        ),
      );
      return;
    }
    cb(null, true);
  },
}).single('file');

/** Dedicated PDF catalog upload — application/pdf only, max 25MB */
export const pdfUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError(400, 'INVALID_PDF_TYPE', 'Only PDF uploads are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
