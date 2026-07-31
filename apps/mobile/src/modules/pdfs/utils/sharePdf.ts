/**
 * Share / “download” a local PDF via the system share sheet (Save to Files / Drive).
 */
import * as Sharing from 'expo-sharing';

export async function shareOrDownloadPdf(localUri: string, title?: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(localUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: title ? `Download “${title}”` : 'Download PDF',
  });
}
