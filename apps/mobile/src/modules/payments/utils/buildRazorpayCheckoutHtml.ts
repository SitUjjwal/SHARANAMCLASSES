/**
 * Builds the HTML page that loads Razorpay Checkout.js inside a WebView.
 * Events are posted back to React Native via window.ReactNativeWebView.postMessage.
 */
export type RazorpayCheckoutOptions = {
  keyId: string;
  amountPaise: number;
  currency: string;
  orderId: string;
  courseTitle: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
};

export function buildRazorpayCheckoutHtml(options: RazorpayCheckoutOptions): string {
  const payload = JSON.stringify({
    key: options.keyId,
    amount: options.amountPaise,
    currency: options.currency || 'INR',
    name: 'SHARANAM CLASSES',
    description: options.courseTitle,
    order_id: options.orderId,
    theme: { color: '#C9A227' },
    prefill: {
      name: options.prefillName || '',
      email: options.prefillEmail || '',
      contact: options.prefillContact || '',
    },
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>Pay</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    html, body { margin: 0; padding: 0; background: #0B1F3A; height: 100%; }
    .wrap { display:flex; align-items:center; justify-content:center; height:100%;
            color:#fff; font-family: system-ui, sans-serif; font-size: 15px; }
  </style>
</head>
<body>
  <div class="wrap" id="status">Opening secure checkout…</div>
  <script>
    (function () {
      function post(msg) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }

      try {
        var options = ${payload};
        options.handler = function (response) {
          post({
            type: 'success',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        };
        options.modal = {
          ondismiss: function () {
            post({ type: 'cancel' });
          }
        };

        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          var err = (response && response.error) || {};
          post({
            type: 'failure',
            code: err.code || 'PAYMENT_FAILED',
            description: err.description || 'Payment failed',
            reason: err.reason || ''
          });
        });
        rzp.open();
        document.getElementById('status').textContent = 'Complete payment in the checkout window';
      } catch (e) {
        post({ type: 'failure', code: 'CHECKOUT_ERROR', description: String(e && e.message || e) });
      }
    })();
  </script>
</body>
</html>`;
}
