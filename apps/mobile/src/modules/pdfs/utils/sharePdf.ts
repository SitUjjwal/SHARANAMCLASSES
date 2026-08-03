/**
 * Share / “download” a local PDF via the system share sheet (Save to Files / Drive).
 * Copies to a friendly filename first so the share sheet shows a real PDF name.
 */
import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function sanitizeFilename(title?: string): string {
  const base = (title?.trim() || 'sharanam-notes').replace(/[^\w\s.-]+/g, '').trim();
  const clipped = (base || 'sharanam-notes').slice(0, 60);
  return clipped.toLowerCase().endsWith('.pdf') ? clipped : `${clipped}.pdf`;
}

async function copyForShare(localUri: string, title?: string): Promise<string> {
  const name = sanitizeFilename(title);

  try {
    const dest = new File(Paths.cache, name);
    if (dest.exists) {
      dest.delete();
    }
    const source = new File(localUri);
    source.copy(dest);
    return dest.uri;
  } catch {
    // Legacy fallback
    const base = LegacyFS.cacheDirectory ?? LegacyFS.documentDirectory;
    if (!base) return localUri;
    const dest = `${base}${name}`;
    await LegacyFS.copyAsync({ from: localUri, to: dest });
    return dest;
  }
}

export async function shareOrDownloadPdf(localUri: string, title?: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  if (!localUri) {
    throw new Error('PDF file is not ready yet. Wait for it to finish loading.');
  }

  const shareUri = await copyForShare(localUri, title);

  await Sharing.shareAsync(shareUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: title ? `Download “${title}”` : 'Download PDF',
  });
}
