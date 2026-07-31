/**
 * payment.service.ts — mobile client for Razorpay order + verify + history.
 */
import type {
  ApiSuccessResponse,
  CreatePaymentOrderResult,
  PurchaseHistoryPage,
  PurchaseReceipt,
  VerifyPaymentResult,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function createPaymentOrder(
  courseId: string,
): Promise<CreatePaymentOrderResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<CreatePaymentOrderResult>>(
    '/payments/create-order',
    { course_id: courseId },
  );
  return data.data;
}

export type VerifyPaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function verifyPayment(
  payload: VerifyPaymentPayload,
): Promise<VerifyPaymentResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<VerifyPaymentResult>>(
    '/payments/verify',
    payload,
  );
  return data.data;
}

export async function fetchPurchaseHistory(): Promise<PurchaseHistoryPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<PurchaseHistoryPage>>(
    '/payments/history',
  );
  return data.data;
}

/** Alias of purchase history via GET /orders */
export async function fetchOrders(): Promise<PurchaseHistoryPage> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<PurchaseHistoryPage>>('/orders');
  return data.data;
}

/**
 * Download receipt by Razorpay payment id (preferred) or internal order UUID.
 */
export async function fetchPurchaseReceipt(
  paymentIdOrOrderId: string,
): Promise<PurchaseReceipt> {
  const { data } = await apiClient.get<ApiSuccessResponse<PurchaseReceipt>>(
    `/receipt/${paymentIdOrOrderId}`,
  );
  return data.data;
}
