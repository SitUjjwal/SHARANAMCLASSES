/**
 * payment.validators.ts
 *
 * Zod schemas for Create Order and Verify Payment APIs.
 * Prefer `product_id` (generic SKU). `course_id` remains for mobile BC.
 */
import { z } from 'zod';

/** Client sends product SKU and/or course — amount is never trusted from the client. */
export const createPaymentOrderSchema = z
  .object({
    product_id: z.string().uuid().optional(),
    course_id: z.string().uuid().optional(),
  })
  .refine((body) => Boolean(body.product_id || body.course_id), {
    message: 'Provide product_id or course_id',
    path: ['product_id'],
  });

/**
 * Fields returned by Razorpay Checkout on success.
 * Signature must be verified server-side; status flags from the client are ignored.
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(5).max(64),
  razorpay_payment_id: z.string().trim().min(5).max(64),
  razorpay_signature: z.string().trim().min(20).max(128),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
