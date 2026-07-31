/**
 * Public exports for the Razorpay integration adapter.
 * Import from here in services — do not reach into SDK types elsewhere.
 */
export {
  __resetRazorpayClientForTests,
  assertRazorpayConfigured,
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayClient,
  getRazorpayKeyId,
  isRazorpayConfigured,
  type RazorpayCreatedOrder,
  type RazorpayPaymentEntity,
} from './client';

export {
  computePaymentSignature,
  verifyPaymentSignature,
  verifyWebhookSignature,
  type PaymentSignaturePayload,
} from './signature';
