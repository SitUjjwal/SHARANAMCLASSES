/**
 * Offline PDF cache — download once to Paths.cache/pdfs/{pdfId}.pdf.
 * Supported via expo-file-system (device cache; OS may purge under storage pressure).
 */
import { Directory, File, Paths } from 'expo-file-system';

function pdfsDirectory(): Directory {
  const dir = new Directory(Paths.cache, 'pdfs');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function cachedFile(pdfId: string): File {
  const safeId = pdfId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return new File(pdfsDirectory(), `${safeId}.pdf`);
}

/** Returns local file URI if already cached. */
export function getCachedPdfUri(pdfId: string): string | null {
  try {
    const file = cachedFile(pdfId);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Ensure PDF is on disk. Reuses cache when present.
 * Returns local file:// URI.
 */
export async function ensurePdfCached(pdfId: string, remoteUrl: string): Promise<string> {
  const file = cachedFile(pdfId);
  if (file.exists && file.size > 0) {
    return file.uri;
  }

  const downloaded = await File.downloadFileAsync(remoteUrl, file, { idempotent: true });
  return downloaded.uri;
}

export async function clearCachedPdf(pdfId: string): Promise<void> {
  try {
    const file = cachedFile(pdfId);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // ignore
  }
}
