/**
 * usePdfSource — resolve remote URL → cache → viewer URI, with offline support.
 */
import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import {
  ensurePdfCached,
  getCachedPdfUri,
} from '@/modules/pdfs/utils/pdfCache';
import { resolvePdfViewerUri } from '@/modules/pdfs/utils/resolvePdfViewerUri';

export type PdfSourceState = {
  loading: boolean;
  offline: boolean;
  fromCache: boolean;
  localUri: string | null;
  viewerUri: string | null;
  error: string | null;
  reload: () => void;
};

export function usePdfSource(pdfId: string | null, remoteUrl: string | null): PdfSourceState {
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!pdfId || !remoteUrl) {
        setLoading(false);
        setError('PDF URL is missing');
        return;
      }

      setLoading(true);
      setError(null);

      const net = await NetInfo.fetch();
      const isOffline =
        net.isConnected === false || net.isInternetReachable === false;

      if (cancelled) return;
      setOffline(isOffline);

      const existing = getCachedPdfUri(pdfId);

      try {
        if (isOffline) {
          if (!existing) {
            setLocalUri(null);
            setViewerUri(null);
            setFromCache(false);
            setError('You’re offline and this PDF isn’t cached yet. Connect and retry.');
            return;
          }
          setLocalUri(existing);
          setFromCache(true);
          setViewerUri(
            resolvePdfViewerUri({
              remoteUrl,
              localUri: existing,
              offline: true,
            }),
          );
          return;
        }

        // Online: refresh cache (idempotent), then open
        const cached = await ensurePdfCached(pdfId, remoteUrl);
        if (cancelled) return;
        setLocalUri(cached);
        setFromCache(Boolean(existing));
        setViewerUri(
          resolvePdfViewerUri({
            remoteUrl,
            localUri: cached,
            offline: false,
          }),
        );
      } catch (err) {
        if (cancelled) return;
        // Fall back to existing cache if download fails
        if (existing) {
          setLocalUri(existing);
          setFromCache(true);
          setViewerUri(
            resolvePdfViewerUri({
              remoteUrl,
              localUri: existing,
              offline: isOffline,
            }),
          );
          setError(null);
          return;
        }
        setLocalUri(null);
        setViewerUri(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Couldn’t download the PDF. Check your connection and retry.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pdfId, remoteUrl, nonce]);

  return {
    loading,
    offline,
    fromCache,
    localUri,
    viewerUri,
    error,
    reload,
  };
}
