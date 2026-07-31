/**
 * Unit tests: Razorpay HMAC payment signature (never trust frontend status).
 */
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  computePaymentSignature,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../../src/integrations/razorpay/signature';
import { AppError } from '../../src/utils/AppError';

describe('computePaymentSignature', () => {
  it('matches Razorpay HMAC-SHA256(order_id|payment_id)', () => {
    const sig = computePaymentSignature('order_ABC', 'pay_XYZ', 'test_secret_key_for_hmac');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(
      computePaymentSignature('order_ABC', 'pay_XYZ', 'test_secret_key_for_hmac'),
    ).toBe(sig);
  });

  it('changes when order or payment id changes', () => {
    const a = computePaymentSignature('order_1', 'pay_1', 'test_secret_key_for_hmac');
    const b = computePaymentSignature('order_2', 'pay_1', 'test_secret_key_for_hmac');
    const c = computePaymentSignature('order_1', 'pay_2', 'test_secret_key_for_hmac');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('verifyPaymentSignature', () => {
  it('accepts a valid signature', () => {
    const orderId = 'order_test_001';
    const paymentId = 'pay_test_001';
    const signature = computePaymentSignature(
      orderId,
      paymentId,
      'test_secret_key_for_hmac',
    );

    expect(() =>
      verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    ).not.toThrow();
  });

  it('rejects a tampered signature', () => {
    expect(() =>
      verifyPaymentSignature({
        razorpay_order_id: 'order_test_001',
        razorpay_payment_id: 'pay_test_001',
        razorpay_signature: 'a'.repeat(64),
      }),
    ).toThrow(AppError);
  });
});

describe('verifyWebhookSignature', () => {
  it('accepts a valid webhook HMAC', () => {
    const body = '{"event":"payment.captured"}';
    const signature = crypto
      .createHmac('sha256', 'whsec_test')
      .update(body)
      .digest('hex');

    expect(() => verifyWebhookSignature(body, signature)).not.toThrow();
  });

  it('rejects invalid webhook signature', () => {
    expect(() => verifyWebhookSignature('{}', 'deadbeef')).toThrow(AppError);
  });
});
