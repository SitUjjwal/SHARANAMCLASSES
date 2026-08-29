/**
 * PdfWebView — render a cached PDF with pdf.js (Android WebView cannot show PDF URLs).
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as LegacyFS from 'expo-file-system/legacy';

import { PdfLoadingOverlay } from '@/modules/pdfs/components/PdfLoadingOverlay';
import { buildPdfJsHtml } from '@/modules/pdfs/utils/buildPdfJsHtml';

type PdfWebViewProps = {
  localUri: string;
  onLoadEnd?: () => void;
  onError?: (message: string) => void;
};

const MAX_INLINE_BYTES = 12 * 1024 * 1024;

export function PdfWebView({ localUri, onLoadEnd, onError }: PdfWebViewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBooting(true);
      setHtml(null);
      try {
        const info = await LegacyFS.getInfoAsync(localUri);
        if (!info.exists) {
          throw new Error('PDF file is missing on this device.');
        }
        const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;
        if (size > MAX_INLINE_BYTES) {
          throw new Error('This PDF is too large to preview. Use Download to open it.');
        }
        const base64 = await LegacyFS.readAsStringAsync(localUri, {
          encoding: LegacyFS.EncodingType.Base64,
        });
        if (cancelled) return;
        setHtml(buildPdfJsHtml(base64));
      } catch (err) {
        if (cancelled) return;
        setBooting(false);
        onError?.(
          err instanceof Error
            ? err.message
            : 'Couldn’t display this PDF. Try Download instead.',
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Parent passes an inline onError; do not retrigger the file read every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localUri]);

  if (!html) {
    return (
      <View style={styles.wrap}>
        {booting ? <PdfLoadingOverlay message="Opening PDF…" /> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {booting ? <PdfLoadingOverlay message="Opening PDF…" /> : null}
      <WebView
        source={{ html, baseUrl: 'https://cdnjs.cloudflare.com/' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        startInLoadingState={false}
        onLoadEnd={() => {
          setBooting(false);
          onLoadEnd?.();
        }}
        onError={() => {
          setBooting(false);
          onError?.('Couldn’t display this PDF. Try Download instead.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#111',
  },
});
