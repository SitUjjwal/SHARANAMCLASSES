/**
 * Offline PDF cache — download to documentDirectory/pdfs/{pdfId}.pdf.
 * Validates %PDF magic so we never cache HTML/error bodies.
 */
import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';

function pdfsDirectory(): Directory {
  // Prefer documents over cache so OS purge is less likely mid-session
  const dir = new Directory(Paths.document, 'pdfs');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function safePdfId(pdfId: string): string {
  return pdfId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

function cachedFile(pdfId: string): File {
  return new File(pdfsDirectory(), `${safePdfId(pdfId)}.pdf`);
}

function legacyCachedPath(pdfId: string): string {
  const base = LegacyFS.documentDirectory ?? LegacyFS.cacheDirectory;
  if (!base) {
    throw new Error('File system is not available on this device');
  }
  return `${base}pdfs/${safePdfId(pdfId)}.pdf`;
}

async function ensureLegacyDir(): Promise<void> {
  const base = LegacyFS.documentDirectory ?? LegacyFS.cacheDirectory;
  if (!base) return;
  const dir = `${base}pdfs`;
  const info = await LegacyFS.getInfoAsync(dir);
  if (!info.exists) {
    await LegacyFS.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function looksLikePdf(uri: string): Promise<boolean> {
  try {
    const head = await LegacyFS.readAsStringAsync(uri, {
      encoding: LegacyFS.EncodingType.Base64,
      length: 8,
      position: 0,
    });
    // "%PDF-" in base64 starts with JVBERi0
    return head.startsWith('JVBERi');
  } catch {
    // If sniffing fails, don't block share/open
    return true;
  }
}

/** Returns local file URI if already cached and looks like a PDF. */
export function getCachedPdfUri(pdfId: string): string | null {
  try {
    const file = cachedFile(pdfId);
    if (file.exists && (file.size ?? 0) > 0) {
      return file.uri;
    }
  } catch {
    // fall through
  }
  return null;
}

async function downloadWithNewApi(pdfId: string, remoteUrl: string): Promise<string> {
  const file = cachedFile(pdfId);
  if (file.exists) {
    try {
      file.delete();
    } catch {
      // overwrite via idempotent download
    }
  }

  const downloaded = await File.downloadFileAsync(remoteUrl, file, { idempotent: true });
  return downloaded.uri;
}

async function downloadWithLegacyApi(pdfId: string, remoteUrl: string): Promise<string> {
  await ensureLegacyDir();
  const path = legacyCachedPath(pdfId);
  const result = await LegacyFS.downloadAsync(remoteUrl, path);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`PDF download failed (HTTP ${result.status})`);
  }
  return result.uri;
}

/**
 * Ensure PDF is on disk. Reuses cache when present and valid.
 * Returns local file:// URI.
 */
export async function ensurePdfCached(pdfId: string, remoteUrl: string): Promise<string> {
  if (!remoteUrl?.trim()) {
    throw new Error('PDF URL is missing');
  }

  const existing = getCachedPdfUri(pdfId);
  if (existing && (await looksLikePdf(existing))) {
    return existing;
  }

  // Stale/corrupt cache — remove before re-download
  if (existing) {
    await clearCachedPdf(pdfId);
  }

  let uri: string;
  try {
    uri = await downloadWithNewApi(pdfId, remoteUrl);
  } catch (primaryError) {
    try {
      uri = await downloadWithLegacyApi(pdfId, remoteUrl);
    } catch (legacyError) {
      const msg =
        primaryError instanceof Error
          ? primaryError.message
          : legacyError instanceof Error
            ? legacyError.message
            : 'Couldn’t download the PDF';
      throw new Error(msg);
    }
  }

  if (!(await looksLikePdf(uri))) {
    await clearCachedPdf(pdfId);
    throw new Error('Downloaded file is not a valid PDF. Try again or report this content.');
  }

  return uri;
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
  try {
    const path = legacyCachedPath(pdfId);
    const info = await LegacyFS.getInfoAsync(path);
    if (info.exists) {
      await LegacyFS.deleteAsync(path, { idempotent: true });
    }
  } catch {
    // ignore
  }
}
