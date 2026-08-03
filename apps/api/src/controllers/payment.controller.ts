/**
 * payment.controller.ts
 *
 * HTTP adapters for Create Order, Verify, Purchase History, Receipt.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createPaymentOrder,
  getPurchaseReceipt,
  listPurchaseHistory,
  verifyPayment,
} from '../services/payment.service';
import {
  exportAdminPaymentsCsv,
  getAdminPaymentStats,
  listAdminPayments,
} from '../services/paymentAdmin.service';
import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from '../validators/payment.validators';
import type {
  AdminExportPaymentsQuery,
  AdminListPaymentsQuery,
} from '../validators/paymentAdmin.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

/** POST /payments/orders */
export async function postCreatePaymentOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const input = req.body as CreatePaymentOrderInput;
    const data = await createPaymentOrder(userId, input);
    res.status(201).json({ success: true, data, message: 'Payment order created' });
  } catch (error) {
    next(error);
  }
}

/** POST /payments/verify */
export async function postVerifyPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const input = req.body as VerifyPaymentInput;
    const data = await verifyPayment(userId, input);
    res.status(200).json({
      success: true,
      data,
      message: 'Payment verified. Course unlocked.',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /payments/history */
export async function getPaymentHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const query = req.query as {
      page?: number;
      pageSize?: number;
      status?: string;
    };
    const data = await listPurchaseHistory(userId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /payments/history/:orderId/receipt (legacy) */
export async function getPaymentReceipt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const orderId = requireParam(req.params.orderId, 'orderId');
    const data = await getPurchaseReceipt(userId, orderId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /receipt/:paymentId */
export async function getReceiptByPaymentId(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const paymentId = requireParam(req.params.paymentId, 'paymentId');
    const data = await getPurchaseReceipt(userId, paymentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/payments/stats */
export async function getAdminPaymentsStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminPaymentStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/payments */
export async function getAdminPaymentsList(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as AdminListPaymentsQuery;
    const data = await listAdminPayments(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/payments/export */
export async function getAdminPaymentsExport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as AdminExportPaymentsQuery;
    const data = await exportAdminPaymentsCsv(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
