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

  if (Platform.OS === 'android') {
    return localUri ?? remoteUrl;
  }

  // iOS: prefer Google Docs viewer when online (public R2 URLs work)
  if (!offline && remoteUrl.startsWith('http')) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remoteUrl)}`;
  }

  // Offline iOS — best-effort local URI (may fail; screen offers share/open)
  if (localUri) {
    return localUri;
  }

  return remoteUrl;
}
