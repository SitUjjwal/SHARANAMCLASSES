/**
 * Upload security primitives — MIME/magic, size, dangerous extensions,
 * metadata heuristics, content hashing, and safe object-key renaming.
 *
 * Never trust client Content-Type or original filename for storage decisions.
 */
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

import { AppError } from '../../utils/AppError';

/** Extensions that must never be stored, even if MIME looks safe. */
export const DANGEROUS_EXTENSIONS = new Set([
  'exe',
  'dll',
  'bat',
  'cmd',
  'com',
  'scr',
  'msi',
  'msp',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'php',
  'phtml',
  'asp',
  'aspx',
  'jsp',
  'cgi',
  'sh',
  'bash',
  'zsh',
  'ps1',
  'vbs',
  'vbe',
  'wsf',
  'wsh',
  'hta',
  'jar',
  'war',
  'apk',
  'ipa',
  'html',
  'htm',
  'shtml',
  'xhtml',
  'svg', // XSS vector when served as image/svg+xml
  'svgz',
  'swf',
  'iso',
  'img',
  'dmg',
  'lnk',
  'reg',
  'inf',
  'sys',
]);

export type UploadKind = 'pdf' | 'image' | 'logo';

export type UploadProfile = {
  kind: UploadKind;
  maxBytes: number;
  allowedMimes: ReadonlySet<string>;
  /** Canonical extensions we emit on renamed keys (no client influence). */
  canonicalExtByMime: ReadonlyMap<string, string>;
};

export const UPLOAD_PROFILES: Record<UploadKind, UploadProfile> = {
  pdf: {
    kind: 'pdf',
    maxBytes: 25 * 1024 * 1024,
    allowedMimes: new Set(['application/pdf']),
    canonicalExtByMime: new Map([['application/pdf', 'pdf']]),
  },
  image: {
    kind: 'image',
    maxBytes: 5 * 1024 * 1024,
    allowedMimes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    canonicalExtByMime: new Map([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
    ]),
  },
  logo: {
    kind: 'logo',
    maxBytes: 2 * 1024 * 1024,
    allowedMimes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    canonicalExtByMime: new Map([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
    ]),
  },
};

export type SecureFileInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export type ValidatedSecureFile = {
  buffer: Buffer;
  /** Sniffed / verified MIME — never the client claim alone */
  mimeType: string;
  /** Canonical extension for the object key */
  extension: string;
  /** Safe display name for DB only (not used as storage key) */
  displayName: string;
  byteLength: number;
  contentHash: string;
  warnings: string[];
};

function allFilenameExtensions(originalname: string): string[] {
  const base = path.basename(originalname || '').toLowerCase();
  const parts = base.split('.').filter(Boolean);
  if (parts.length <= 1) return [];
  return parts.slice(1);
}

export function assertNoDangerousExtensions(originalname: string): void {
  const exts = allFilenameExtensions(originalname);
  for (const ext of exts) {
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      throw new AppError(
        400,
        'DANGEROUS_FILE_EXTENSION',
        `File extension .${ext} is not allowed`,
      );
    }
  }
  // Double-extension tricks: report.pdf.exe already caught; also block report.exe.pdf
  if (exts.length >= 2) {
    const inner = exts.slice(0, -1);
    for (const ext of inner) {
      if (DANGEROUS_EXTENSIONS.has(ext) || ext === 'php' || ext === 'html') {
        throw new AppError(
          400,
          'DANGEROUS_FILE_EXTENSION',
          'Compound filename with a dangerous extension is not allowed',
        );
      }
    }
  }
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // PDF
  if (buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    return 'application/pdf';
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.subarray(0, 8).equals(png)) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  // SVG / HTML disguised as image
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<!doctype html') || head.includes('<html')) {
    return 'text/html';
  }

  return null;
}

/**
 * Lightweight metadata / payload heuristics (not a full AV scanner).
 * Rejects known-dangerous PDF/JS/HTML payloads and polyglots.
 */
export function scanFileMetadata(
  buffer: Buffer,
  mimeType: string,
): { ok: true; warnings: string[] } | { ok: false; reason: string } {
  const warnings: string[] = [];

  // Reject NUL-heavy polyglots in the first 8KB
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  let nulCount = 0;
  for (const byte of sample) {
    if (byte === 0) nulCount += 1;
  }
  if (mimeType.startsWith('image/') && nulCount > sample.length * 0.4) {
    return { ok: false, reason: 'Image metadata scan failed (suspicious binary density)' };
  }

  if (mimeType === 'application/pdf') {
    const text = buffer.subarray(0, Math.min(buffer.length, 512 * 1024)).toString('latin1');
    const dangerousPdf = [
      /\/JavaScript\b/i,
      /\/JS\b/,
      /\/OpenAction\b/i,
      /\/Launch\b/i,
      /\/EmbeddedFile\b/i,
      /\/AA\b/,
      /\/RichMedia\b/i,
    ];
    for (const re of dangerousPdf) {
      if (re.test(text)) {
        return {
          ok: false,
          reason: 'PDF rejected: contains active or embedded script content',
        };
      }
    }
    if (!/%PDF-1\.\d/.test(text.slice(0, 16)) && !text.startsWith('%PDF')) {
      return { ok: false, reason: 'PDF header metadata is invalid' };
    }
    // Trailer hint
    if (buffer.length > 32) {
      const tail = buffer.subarray(buffer.length - Math.min(buffer.length, 1024)).toString('latin1');
      if (!/%%EOF/i.test(tail)) {
        warnings.push('PDF missing %%EOF trailer (accepted with caution)');
      }
    }
  }

  if (mimeType.startsWith('image/')) {
    const ascii = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf8').toLowerCase();
    if (
      ascii.includes('<script') ||
      ascii.includes('javascript:') ||
      ascii.includes('<?php') ||
      ascii.includes('<%')
    ) {
      return { ok: false, reason: 'Image rejected: embedded script/metadata payload' };
    }
    // EXIF APP1 present — note only (we do not rewrite EXIF without an image lib)
    if (mimeType === 'image/jpeg' && buffer.includes(Buffer.from('Exif\0\0'))) {
      warnings.push('JPEG contains EXIF metadata');
    }
  }

  return { ok: true, warnings };
}

export function sanitizeDisplayName(originalname: string, fallbackExt: string): string {
  const base = path.basename(originalname || `file.${fallbackExt}`);
  const cleaned = base.replace(/[^\w.\-() ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!cleaned || cleaned === '.' || cleaned.startsWith('.')) {
    return `file.${fallbackExt}`;
  }
  return cleaned;
}

export function hashFileContent(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Build a content-addressed object key: `{prefix}/{sha256}.{ext}`
 * Same bytes → same key → natural duplicate prevention.
 */
export function buildContentAddressedKey(
  prefix: string,
  contentHash: string,
  extension: string,
): string {
  const safePrefix = prefix.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  return `${safePrefix}/${contentHash}.${safeExt}`;
}

/** UUID key when content-addressing is not desired (e.g. certificates overwrite). */
export function buildRandomObjectKey(prefix: string, extension: string): string {
  const safePrefix = prefix.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  return `${safePrefix}/${Date.now()}-${randomUUID()}.${safeExt}`;
}

/**
 * Full validation gate before any PutObject.
 */
export function validateSecureUpload(
  file: SecureFileInput,
  profile: UploadProfile,
): ValidatedSecureFile {
  assertNoDangerousExtensions(file.originalname);

  if (!file.buffer?.length || file.size <= 0) {
    throw new AppError(400, 'EMPTY_FILE', 'Uploaded file is empty');
  }
  if (file.size > profile.maxBytes || file.buffer.length > profile.maxBytes) {
    throw new AppError(
      400,
      'FILE_TOO_LARGE',
      `File must be ${Math.floor(profile.maxBytes / (1024 * 1024))}MB or smaller`,
    );
  }
  if (file.buffer.length !== file.size && Math.abs(file.buffer.length - file.size) > 0) {
    // Prefer buffer length as source of truth
  }

  const sniffed = sniffMime(file.buffer);
  if (!sniffed) {
    throw new AppError(400, 'UNRECOGNIZED_FILE_TYPE', 'Could not verify file type from content');
  }
  if (sniffed === 'text/html') {
    throw new AppError(400, 'DANGEROUS_FILE_CONTENT', 'HTML/SVG content is not allowed');
  }
  if (!profile.allowedMimes.has(sniffed)) {
    throw new AppError(
      400,
      'INVALID_FILE_TYPE',
      `File type ${sniffed} is not allowed for this upload`,
    );
  }

  // Client MIME must not contradict magic (allow empty/octet-stream drift only if magic wins)
  const claimed = (file.mimetype || '').toLowerCase().trim();
  if (
    claimed &&
    claimed !== 'application/octet-stream' &&
    claimed !== sniffed &&
    !(claimed === 'image/jpg' && sniffed === 'image/jpeg')
  ) {
    throw new AppError(
      400,
      'MIME_MISMATCH',
      `Declared type (${claimed}) does not match file content (${sniffed})`,
    );
  }

  const scan = scanFileMetadata(file.buffer, sniffed);
  if (!scan.ok) {
    throw new AppError(400, 'METADATA_SCAN_FAILED', scan.reason);
  }

  const extension = profile.canonicalExtByMime.get(sniffed);
  if (!extension) {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'No canonical extension for verified MIME type');
  }

  return {
    buffer: file.buffer,
    mimeType: sniffed,
    extension,
    displayName: sanitizeDisplayName(file.originalname, extension),
    byteLength: file.buffer.length,
    contentHash: hashFileContent(file.buffer),
    warnings: scan.warnings,
  };
}
