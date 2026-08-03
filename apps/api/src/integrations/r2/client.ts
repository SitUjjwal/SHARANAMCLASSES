/**
 * Cloudflare R2 client (S3-compatible) — secure Put / Head / Delete + signed URLs.
 *
 * Architecture (see docs/api/r2-upload-security.md):
 *   Multer size/MIME gate → validateSecureUpload → content-hash key →
 *   HeadObject (dedupe) → PutObject + metadata → public URL and/or signed URL
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env, isR2Configured } from '../../config/env';
import { AppError } from '../../utils/AppError';
import {
  buildContentAddressedKey,
  type SecureFileInput,
  type UploadKind,
  UPLOAD_PROFILES,
  validateSecureUpload,
  type ValidatedSecureFile,
} from './fileSecurity';

let client: S3Client | null = null;

function getEndpoint(): string {
  if (env.R2_ENDPOINT.trim()) {
    return env.R2_ENDPOINT.replace(/\/$/, '');
  }
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new AppError(
      503,
      'R2_NOT_CONFIGURED',
      'Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL.',
    );
  }

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: getEndpoint(),
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });
  }

  return client;
}

function publicUrlForKey(key: string): string {
  const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${base}/${key}`;
}

export type R2UploadResult = {
  storage_key: string;
  file_url: string;
  bucket: string;
  /** Present when signed URL generation succeeded */
  signed_url?: string;
  signed_url_expires_at?: string;
  content_hash?: string;
  deduplicated?: boolean;
  mime_type?: string;
  original_filename?: string;
  warnings?: string[];
};

export async function r2ObjectExists(key: string): Promise<boolean> {
  const s3 = getR2Client();
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
    const status =
      err && typeof err === 'object' && '$metadata' in err
        ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
        : undefined;
    if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
      return false;
    }
    // Some R2 responses use 403 for missing with certain policies — treat as missing only on clear 404
    throw new AppError(
      500,
      'R2_HEAD_FAILED',
      err instanceof Error ? err.message : 'Failed to check object in Cloudflare R2',
    );
  }
}

/**
 * Time-limited GetObject URL (secure download link).
 * Prefer this for PDFs / private assets; public URL remains for CDN-friendly branding assets.
 */
export async function createSignedR2Url(
  storageKey: string,
  expiresInSeconds = env.R2_SIGNED_URL_TTL_SECONDS,
): Promise<{ url: string; expires_at: string }> {
  const s3 = getR2Client();
  const ttl = Math.min(Math.max(expiresInSeconds, 60), 7 * 24 * 3600);
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: storageKey,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: ttl });
  return {
    url,
    expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
  };
}

export async function putR2Object(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  contentHash?: string;
  skipIfExists?: boolean;
}): Promise<R2UploadResult> {
  const s3 = getR2Client();

  if (input.skipIfExists) {
    const exists = await r2ObjectExists(input.key);
    if (exists) {
      let signed: { url: string; expires_at: string } | undefined;
      try {
        signed = await createSignedR2Url(input.key);
      } catch {
        signed = undefined;
      }
      return {
        storage_key: input.key,
        file_url: publicUrlForKey(input.key),
        bucket: env.R2_BUCKET,
        signed_url: signed?.url,
        signed_url_expires_at: signed?.expires_at,
        content_hash: input.contentHash,
        deduplicated: true,
        mime_type: input.contentType,
      };
    }
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
        Metadata: {
          ...(input.contentHash ? { 'content-sha256': input.contentHash } : {}),
          ...input.metadata,
        },
      }),
    );
  } catch (err) {
    throw new AppError(
      500,
      'R2_UPLOAD_FAILED',
      err instanceof Error ? err.message : 'Failed to upload file to Cloudflare R2',
    );
  }

  let signed: { url: string; expires_at: string } | undefined;
  try {
    signed = await createSignedR2Url(input.key);
  } catch {
    signed = undefined;
  }

  return {
    storage_key: input.key,
    file_url: publicUrlForKey(input.key),
    bucket: env.R2_BUCKET,
    signed_url: signed?.url,
    signed_url_expires_at: signed?.expires_at,
    content_hash: input.contentHash,
    deduplicated: false,
    mime_type: input.contentType,
  };
}

/**
 * Secure upload pipeline used by all user/admin multipart → R2 flows.
 */
export async function securePutToR2(input: {
  file: SecureFileInput;
  kind: UploadKind;
  /** Storage namespace, e.g. `pdfs`, `avatars/{userId}` */
  prefix: string;
  cacheControl?: string;
  extraMetadata?: Record<string, string>;
}): Promise<R2UploadResult & { validated: ValidatedSecureFile }> {
  const profile = UPLOAD_PROFILES[input.kind];
  const validated = validateSecureUpload(input.file, profile);
  const key = buildContentAddressedKey(input.prefix, validated.contentHash, validated.extension);

  const uploaded = await putR2Object({
    key,
    body: validated.buffer,
    contentType: validated.mimeType,
    cacheControl: input.cacheControl,
    contentHash: validated.contentHash,
    skipIfExists: true,
    metadata: {
      'original-filename': validated.displayName.slice(0, 180),
      'upload-kind': input.kind,
      ...input.extraMetadata,
    },
  });

  if (validated.warnings.length) {
    console.warn('[r2] upload warnings', key, validated.warnings.join('; '));
  }

  return {
    ...uploaded,
    mime_type: validated.mimeType,
    original_filename: validated.displayName,
    warnings: validated.warnings,
    validated,
  };
}

export async function deleteR2Object(storageKey: string): Promise<void> {
  if (!storageKey || !isR2Configured()) {
    return;
  }

  const s3 = getR2Client();
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: storageKey,
      }),
    );
  } catch (err) {
    console.warn('[r2] delete failed', storageKey, err);
  }
}

/** Read object body into a Buffer (for backup restore / internal tools). */
export async function getR2ObjectBuffer(storageKey: string): Promise<{
  body: Buffer;
  contentType: string | null;
}> {
  const s3 = getR2Client();
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: storageKey,
      }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      throw new AppError(404, 'R2_OBJECT_EMPTY', 'Backup object body was empty');
    }
    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType ?? null,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      500,
      'R2_GET_FAILED',
      err instanceof Error ? err.message : 'Failed to read object from Cloudflare R2',
    );
  }
}

export { isR2Configured };
