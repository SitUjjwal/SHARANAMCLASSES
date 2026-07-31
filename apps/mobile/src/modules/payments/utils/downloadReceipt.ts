/**
 * Download / share a payment receipt text file via the system share sheet.
 * Uses expo-file-system File/Paths API (Expo SDK 54+).
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function downloadReceiptFile(
  filename: string,
  receiptText: string,
): Promise<void> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const file = new File(Paths.cache, safeName);
  file.write(receiptText);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle: 'Download Receipt',
  });
}
