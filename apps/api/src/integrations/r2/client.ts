/**
 * Cloudflare R2 client (S3-compatible) for PDF object storage.
 *
 * Upload flow:
 *   Admin multipart → API validates PDF → PutObject to R2 → return public URL + key
 *   Postgres stores URL + metadata only (never the binary).
 */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { env, isR2Configured } from '../../config/env';
import { AppError } from '../../utils/AppError';

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

export type R2UploadResult = {
  storage_key: string;
  file_url: string;
  bucket: string;
};

export async function putR2Object(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}): Promise<R2UploadResult> {
  const s3 = getR2Client();
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );
  } catch (err) {
    throw new AppError(
      500,
      'R2_UPLOAD_FAILED',
      err instanceof Error ? err.message : 'Failed to upload file to Cloudflare R2',
    );
  }

  const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
  return {
    storage_key: input.key,
    file_url: `${base}/${input.key}`,
    bucket: env.R2_BUCKET,
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
    // Log-style soft failure — DB row delete should still proceed
    console.warn('[r2] delete failed', storageKey, err);
  }
}

export { isR2Configured };
