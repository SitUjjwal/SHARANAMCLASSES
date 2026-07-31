/**
 * RazorpayCheckoutWebView — Expo-friendly Checkout via Checkout.js in a WebView.
 *
 * Emits: success | failure | cancel (never trusts client alone — caller must verify).
 */
import { Modal, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildRazorpayCheckoutHtml, type RazorpayCheckoutOptions } from '../utils/buildRazorpayCheckoutHtml';

export type { RazorpayCheckoutOptions };

export type RazorpayCheckoutSuccess = {
  type: 'success';
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutFailure = {
  type: 'failure';
  code: string;
  description: string;
  reason?: string;
};

export type RazorpayCheckoutCancel = { type: 'cancel' };

export type RazorpayCheckoutEvent =
  | RazorpayCheckoutSuccess
  | RazorpayCheckoutFailure
  | RazorpayCheckoutCancel;

type Props = {
  visible: boolean;
  options: RazorpayCheckoutOptions | null;
  onEvent: (event: RazorpayCheckoutEvent) => void;
};

export function RazorpayCheckoutWebView({ visible, options, onEvent }: Props) {
  if (!visible || !options) {
    return null;
  }

  const html = buildRazorpayCheckoutHtml(options);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as RazorpayCheckoutEvent;
      if (data?.type === 'success' || data?.type === 'failure' || data?.type === 'cancel') {
        onEvent(data);
      }
    } catch {
      onEvent({
        type: 'failure',
        code: 'INVALID_CHECKOUT_MESSAGE',
        description: 'Unexpected response from payment checkout',
      });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onEvent({ type: 'cancel' })}>
      <View style={styles.container}>
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://api.razorpay.com' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="always"
          setSupportMultipleWindows={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1F3A',
  },
});
