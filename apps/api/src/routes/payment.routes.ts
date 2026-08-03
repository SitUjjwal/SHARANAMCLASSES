/**
 * payment.routes.ts
 *
 * Student (canonical):
 *   POST /payments/create-order
 *   POST /payments/verify
 *   GET  /payments/history
 *   GET  /orders
 *   GET  /receipt/:paymentId
 *
 * Legacy aliases (kept for older clients):
 *   POST /payments/orders
 *   GET  /payments/history/:orderId/receipt
 *
 * Admin Payment Management:
 *   GET  /admin/payments/stats
 *   GET  /admin/payments
 *   GET  /admin/payments/export
 *
 * Also: GET /my-courses (see myCourse.routes.ts)
 */
import { Router } from 'express';

import {
  getAdminPaymentsExport,
  getAdminPaymentsList,
  getAdminPaymentsStats,
  getPaymentHistory,
  getPaymentReceipt,
  getReceiptByPaymentId,
  postCreatePaymentOrder,
  postVerifyPayment,
} from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from '../validators/payment.validators';
import {
  adminExportPaymentsQuerySchema,
  adminListPaymentsQuerySchema,
} from '../validators/paymentAdmin.validators';

export const paymentRouter = Router();

/** Canonical create-order */
paymentRouter.post(
  '/payments/create-order',
  requireAuth,
  validate(createPaymentOrderSchema),
  postCreatePaymentOrder,
);

/** Legacy alias */
paymentRouter.post(
  '/payments/orders',
  requireAuth,
  validate(createPaymentOrderSchema),
  postCreatePaymentOrder,
);

paymentRouter.post(
  '/payments/verify',
  requireAuth,
  validate(verifyPaymentSchema),
  postVerifyPayment,
);

paymentRouter.get('/payments/history', requireAuth, getPaymentHistory);

/** Student orders list (same payload as purchase history) */
paymentRouter.get('/orders', requireAuth, getPaymentHistory);

/** Receipt by Razorpay payment id (or order UUID) */
paymentRouter.get('/receipt/:paymentId', requireAuth, getReceiptByPaymentId);

/** Legacy receipt path */
paymentRouter.get(
  '/payments/history/:orderId/receipt',
  requireAuth,
  getPaymentReceipt,
);

paymentRouter.get(
  '/admin/payments/stats',
  requireAuth,
  requirePermission('payments:read'),
  getAdminPaymentsStats,
);

paymentRouter.get(
  '/admin/payments/export',
  requireAuth,
  requirePermission('payments:read'),
  validate(adminExportPaymentsQuerySchema, 'query'),
  getAdminPaymentsExport,
);

paymentRouter.get(
  '/admin/payments',
  requireAuth,
  requirePermission('payments:read'),
  validate(adminListPaymentsQuerySchema, 'query'),
  getAdminPaymentsList,
);
