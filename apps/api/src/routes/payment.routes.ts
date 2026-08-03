/**
 * payment.routes.ts — all mutating + key query/param paths use Zod validate().
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
import { orderIdParamSchema, paymentIdParamSchema } from '../validators/common.validators';
import {
  createPaymentOrderSchema,
  paymentHistoryQuerySchema,
  verifyPaymentSchema,
} from '../validators/payment.validators';
import {
  adminExportPaymentsQuerySchema,
  adminListPaymentsQuerySchema,
} from '../validators/paymentAdmin.validators';

export const paymentRouter = Router();

paymentRouter.post(
  '/payments/create-order',
  requireAuth,
  validate(createPaymentOrderSchema),
  postCreatePaymentOrder,
);

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

paymentRouter.get(
  '/payments/history',
  requireAuth,
  validate(paymentHistoryQuerySchema, 'query'),
  getPaymentHistory,
);

paymentRouter.get(
  '/orders',
  requireAuth,
  validate(paymentHistoryQuerySchema, 'query'),
  getPaymentHistory,
);

paymentRouter.get(
  '/receipt/:paymentId',
  requireAuth,
  validate(paymentIdParamSchema, 'params'),
  getReceiptByPaymentId,
);

paymentRouter.get(
  '/payments/history/:orderId/receipt',
  requireAuth,
  validate(orderIdParamSchema, 'params'),
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
