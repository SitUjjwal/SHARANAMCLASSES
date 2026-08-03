/**
 * Resolve the URI the WebView should load.
 * Android can often render PDF URLs / file URIs natively.
 * iOS WKWebView cannot — use Google Docs viewer for remote public URLs.
 */
import { Platform } from 'react-native';

export type PdfViewSource = {
  /** Original HTTPS URL from R2 / CDN */
  remoteUrl: string;
  /** Cached local file:// URI when available */
  localUri: string | null;
  offline: boolean;
};

export function resolvePdfViewerUri(source: PdfViewSource): string {
  const { remoteUrl, localUri, offline } = source;

  // Offline: only local cache can work
  if (offline) {
    return localUri ?? remoteUrl;
  }

  if (Platform.OS === 'android') {
    // System WebView renders https:// PDFs; file:// PDFs often fail silently
    return remoteUrl;
  }

  // iOS WKWebView cannot render PDFs natively — Google Docs viewer for remote
  if (remoteUrl.startsWith('http')) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remoteUrl)}`;
  }

  return localUri ?? remoteUrl;
}
