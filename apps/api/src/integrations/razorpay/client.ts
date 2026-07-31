/**
 * Razorpay Payment Gateway client.
 *
 * Why this file exists:
 * - Isolates the vendor SDK behind a thin adapter (ADR 0002).
 * - Loads credentials only from environment variables (never hardcode).
 * - Exposes typed helpers for create-order and fetch-payment used by payment.service.
 *
 * Security:
 * - Key secret stays server-side only.
 * - Checkout on the client receives key_id + order_id — never the secret.
 */
import Razorpay from 'razorpay';

import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export type RazorpayCreatedOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  notes?: Record<string, string>;
  created_at: number;
};

export type RazorpayPaymentEntity = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  captured?: boolean;
  email?: string;
  contact?: string;
  created_at?: number;
};

let client: Razorpay | null = null;

/** True when both key id and secret are present. */
export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID?.trim() && env.RAZORPAY_KEY_SECRET?.trim());
}

/**
 * Fail fast when payment APIs are called without credentials.
 * Development may leave keys empty until ready; production should set them.
 */
export function assertRazorpayConfigured(): void {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      503,
      'PAYMENTS_UNAVAILABLE',
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    );
  }
}

/** Lazy singleton — avoids constructing SDK when payments are unused. */
export function getRazorpayClient(): Razorpay {
  assertRazorpayConfigured();
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/** Public key id safe to send to Checkout (never send the secret). */
export function getRazorpayKeyId(): string {
  assertRazorpayConfigured();
  return env.RAZORPAY_KEY_ID;
}

/**
 * Create a Razorpay order. Amount is always in the smallest currency unit (paise for INR).
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayCreatedOrder> {
  const razorpay = getRazorpayClient();

  try {
    const order = await razorpay.orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: true,
    });
    return order as RazorpayCreatedOrder;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create Razorpay order';
    throw new AppError(502, 'RAZORPAY_ORDER_FAILED', message);
  }
}

/**
 * Fetch payment from Razorpay — never trust the frontend payment status alone.
 */
export async function fetchRazorpayPayment(
  paymentId: string,
): Promise<RazorpayPaymentEntity> {
  const razorpay = getRazorpayClient();

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment as unknown as RazorpayPaymentEntity;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Razorpay payment';
    throw new AppError(502, 'RAZORPAY_PAYMENT_FETCH_FAILED', message);
  }
}

/** Test helper — reset singleton between unit tests. */
export function __resetRazorpayClientForTests(): void {
  client = null;
}
