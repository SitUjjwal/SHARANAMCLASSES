/**
 * Razorpay payment signature verification.
 *
 * Checkout returns: razorpay_order_id, razorpay_payment_id, razorpay_signature.
 * Server must verify HMAC-SHA256(order_id + "|" + payment_id, key_secret)
 * using timing-safe comparison — never trust a client "success" flag.
 *
 * Why this file exists:
 * - Pure crypto helper, easy to unit-test without the Razorpay SDK.
 * - Keeps signature math out of the HTTP/service layer.
 */
import crypto from 'node:crypto';

import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { assertRazorpayConfigured } from './client';

export type PaymentSignaturePayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/**
 * Compute expected signature for an order/payment pair.
 * Exported for tests with a known secret.
 */
export function computePaymentSignature(
  orderId: string,
  paymentId: string,
  secret: string,
): string {
  const body = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Verify Checkout signature. Throws AppError(400) when invalid.
 * Uses timingSafeEqual to reduce timing attack surface.
 */
export function verifyPaymentSignature(payload: PaymentSignaturePayload): void {
  assertRazorpayConfigured();

  const expected = computePaymentSignature(
    payload.razorpay_order_id,
    payload.razorpay_payment_id,
    env.RAZORPAY_KEY_SECRET,
  );

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(payload.razorpay_signature.trim(), 'utf8');

  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw new AppError(
      400,
      'INVALID_PAYMENT_SIGNATURE',
      'Payment signature verification failed',
    );
  }
}

/**
 * Optional webhook signature (X-Razorpay-Signature over raw body).
 * Uses RAZORPAY_WEBHOOK_SECRET when configured.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
): void {
  const secret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new AppError(
      503,
      'WEBHOOK_SECRET_MISSING',
      'RAZORPAY_WEBHOOK_SECRET is not configured',
    );
  }
  if (!signatureHeader?.trim()) {
    throw new AppError(401, 'WEBHOOK_SIGNATURE_MISSING', 'Missing X-Razorpay-Signature');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signatureHeader.trim(), 'utf8');

  if (
    expectedBuf.length !== actualBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw new AppError(401, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook signature invalid');
  }
}
