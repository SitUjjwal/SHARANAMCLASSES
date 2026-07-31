/**
 * PdfWebView — renders a PDF URL (remote or local) inside react-native-webview.
 */
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { PdfLoadingOverlay } from '@/modules/pdfs/components/PdfLoadingOverlay';

type PdfWebViewProps = {
  uri: string;
  onLoadEnd?: () => void;
  onError?: (message: string) => void;
};

export function PdfWebView({ uri, onLoadEnd, onError }: PdfWebViewProps) {
  const [booting, setBooting] = useState(true);

  const handleLoadEnd = useCallback(() => {
    setBooting(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleError = useCallback(() => {
    setBooting(false);
    onError?.('Couldn’t display this PDF. Check your connection or try again.');
  }, [onError]);

  const handleHttpError = useCallback(() => {
    setBooting(false);
    onError?.('PDF link returned an error. Retry or download the file.');
  }, [onError]);

  return (
    <View style={styles.wrap}>
      {booting ? <PdfLoadingOverlay message="Opening PDF…" /> : null}
      <WebView
        key={uri}
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        startInLoadingState={false}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        setSupportMultipleWindows={false}
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
    backgroundColor: 'transparent',
  },
});
