/**
 * payment.service.ts
 *
 * Business rules for Razorpay checkout:
 * 1) Create Order — amount from `courses.price` (server), store row in PostgreSQL
 * 2) Verify Payment — HMAC signature → store payment → purchased_courses → enroll
 *
 * Security invariants:
 * - Never trust frontend payment status or amount
 * - Invalid signatures are rejected before any unlock
 * - Key secret never leaves the server
 * - Paid access only after verified capture + DB writes
 */
import { randomBytes } from 'node:crypto';

import type { CreatePaymentOrderResult, VerifyPaymentResult } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { emitPaymentCompleted } from '../events';
import { logger } from '../logging';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  verifyPaymentSignature,
} from '../integrations/razorpay';
import { AppError } from '../utils/AppError';
import { resolveActorEmail, writeActivityLog } from './activityLog.service';
import {
  paymentOrderRepository,
  type IPaymentOrderRepository,
  type PaymentOrderRow,
} from '../repositories/paymentOrder.repository';
import {
  purchasedCourseRepository,
  type IPurchasedCourseRepository,
} from '../repositories/purchasedCourse.repository';
import {
  productRepository,
  type IProductRepository,
  type ProductRow,
} from '../repositories/product.repository';
import {
  purchaseRepository,
  type IPurchaseRepository,
} from '../repositories/purchase.repository';
import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from '../validators/payment.validators';

const INR = 'INR';

/** Convert course list price (INR rupees) to Razorpay paise. */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Course price must be greater than zero');
  }
  return Math.round(rupees * 100);
}

/** Short unique receipt (Razorpay max 40 chars). */
function buildReceipt(userId: string): string {
  const suffix = randomBytes(4).toString('hex');
  return `sc_${userId.replace(/-/g, '').slice(0, 18)}_${suffix}`.slice(0, 40);
}

async function loadPayableCourse(courseId: string): Promise<{
  id: string;
  title: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, price, is_free, is_published')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
  }
  if (!data || !data.is_published) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return data as {
    id: string;
    title: string;
    price: number;
    is_free: boolean;
    is_published: boolean;
  };
}

async function isAlreadyEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ENROLLMENT_FETCH_FAILED', error.message);
  }
  return Boolean(data);
}

/**
 * Unlock course content via enrollments (My Learning / is_purchased).
 * Idempotent — safe if verify is retried.
 */
export async function grantEnrollmentAfterPayment(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  if (await isAlreadyEnrolled(userId, courseId)) {
    return false;
  }

  const { error } = await supabase.from('enrollments').insert({
    user_id: userId,
    course_id: courseId,
    progress_percent: 0,
  });

  if (error) {
    if (error.code === '23505') {
      return false;
    }
    throw new AppError(400, 'ENROLLMENT_FAILED', error.message);
  }
  return true;
}

/**
 * Record purchase + unlock after payment is confirmed.
 * Always writes `purchases`. Course products also write purchased_courses + enrollments.
 */
export async function unlockProductAfterPayment(input: {
  userId: string;
  product: ProductRow;
  courseId: string | null;
  paymentOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  purchasedAt: string;
  coursePurchases?: IPurchasedCourseRepository;
  catalogPurchases?: IPurchaseRepository;
}): Promise<{ purchased: boolean; enrolled: boolean }> {
  const catalog = input.catalogPurchases ?? purchaseRepository;
  const coursePurchases = input.coursePurchases ?? purchasedCourseRepository;

  await catalog.insert({
    user_id: input.userId,
    product_id: input.product.id,
    payment_order_id: input.paymentOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    amount_paise: input.amountPaise,
    currency: input.currency,
    purchased_at: input.purchasedAt,
  });

  let enrolled = false;
  if (input.product.product_type === 'course') {
    const courseId = input.courseId ?? input.product.product_id;
    await coursePurchases.insert({
      user_id: input.userId,
      course_id: courseId,
      payment_order_id: input.paymentOrderId,
      razorpay_payment_id: input.razorpayPaymentId,
      amount_paise: input.amountPaise,
      currency: input.currency,
      purchased_at: input.purchasedAt,
    });
    await grantEnrollmentAfterPayment(input.userId, courseId);
    enrolled = true;
  }

  return { purchased: true, enrolled };
}

/** @deprecated Prefer unlockProductAfterPayment — kept for tests/callers */
export async function unlockCourseAfterPayment(input: {
  userId: string;
  courseId: string;
  paymentOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  purchasedAt: string;
  purchases?: IPurchasedCourseRepository;
}): Promise<{ purchased: boolean; enrolled: boolean }> {
  const product = await productRepository.upsertCourseProduct({
    courseId: input.courseId,
    title: 'Course',
    price: input.amountPaise / 100,
    isActive: true,
  });

  return unlockProductAfterPayment({
    userId: input.userId,
    product,
    courseId: input.courseId,
    paymentOrderId: input.paymentOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    amountPaise: input.amountPaise,
    currency: input.currency,
    purchasedAt: input.purchasedAt,
    coursePurchases: input.purchases,
  });
}

export type PaymentServiceDeps = {
  orders?: IPaymentOrderRepository;
  purchases?: IPurchasedCourseRepository;
  products?: IProductRepository;
  catalogPurchases?: IPurchaseRepository;
};

async function resolvePayableProduct(
  input: CreatePaymentOrderInput,
  products: IProductRepository,
): Promise<{ product: ProductRow; courseId: string | null }> {
  if (input.product_id) {
    const product = await products.findById(input.product_id);
    if (!product || !product.is_active) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (Number(product.price) <= 0) {
      throw new AppError(
        400,
        'PRODUCT_IS_FREE',
        'This product is free and cannot be purchased via Razorpay',
      );
    }
    const courseId = product.product_type === 'course' ? product.product_id : null;
    if (courseId) {
      const course = await loadPayableCourse(courseId);
      if (course.is_free || Number(course.price) <= 0) {
        throw new AppError(
          400,
          'COURSE_IS_FREE',
          'This course is free. Use POST /courses/:id/enroll instead of payment.',
        );
      }
      // Keep SKU price in sync with course list price
      const synced = await products.upsertCourseProduct({
        courseId: course.id,
        title: course.title,
        price: Number(course.price),
        isActive: course.is_published,
      });
      return { product: synced, courseId: course.id };
    }
    return { product, courseId: null };
  }

  const course = await loadPayableCourse(input.course_id!);
  if (course.is_free || Number(course.price) <= 0) {
    throw new AppError(
      400,
      'COURSE_IS_FREE',
      'This course is free. Use POST /courses/:id/enroll instead of payment.',
    );
  }
  const product = await products.upsertCourseProduct({
    courseId: course.id,
    title: course.title,
    price: Number(course.price),
    isActive: course.is_published,
  });
  return { product, courseId: course.id };
}

/**
 * POST /payments/create-order — create Razorpay order for a product (or legacy course_id).
 */
export async function createPaymentOrder(
  userId: string,
  input: CreatePaymentOrderInput,
  deps: PaymentServiceDeps = {},
): Promise<CreatePaymentOrderResult> {
  const orders = deps.orders ?? paymentOrderRepository;
  const products = deps.products ?? productRepository;

  const { product, courseId } = await resolvePayableProduct(input, products);

  if (courseId && (await isAlreadyEnrolled(userId, courseId))) {
    throw new AppError(409, 'ALREADY_ENROLLED', 'You already own this course');
  }

  const existingPurchase = await (deps.catalogPurchases ?? purchaseRepository).findByUserAndProduct(
    userId,
    product.id,
  );
  if (existingPurchase) {
    throw new AppError(409, 'ALREADY_PURCHASED', 'You already own this product');
  }

  const amountPaise = rupeesToPaise(Number(product.price));
  const receipt = buildReceipt(userId);

  const rzOrder = await createRazorpayOrder({
    amountPaise,
    currency: product.currency || INR,
    receipt,
    notes: {
      user_id: userId,
      product_id: product.id,
      product_type: product.product_type,
      entity_id: product.product_id,
      ...(courseId ? { course_id: courseId } : {}),
    },
  });

  const row = await orders.insert({
    user_id: userId,
    course_id: courseId,
    product_id: product.id,
    amount_paise: amountPaise,
    currency: product.currency || INR,
    receipt,
    razorpay_order_id: rzOrder.id,
    metadata: {
      product_title: product.title,
      product_type: product.product_type,
      course_title: product.title,
      razorpay_status: rzOrder.status,
    },
  });

  logger.payment('Payment order created', {
    user_id: userId,
    order_id: row.id,
    razorpay_order_id: rzOrder.id,
    product_id: product.id,
    amount_paise: amountPaise,
    currency: product.currency || INR,
  });

  return {
    order_id: row.id,
    razorpay_order_id: rzOrder.id,
    amount_paise: amountPaise,
    currency: product.currency || INR,
    key_id: getRazorpayKeyId(),
    product_id: product.id,
    product_type: product.product_type,
    course_id: courseId,
    course_title: product.title,
    title: product.title,
    receipt,
  };
}

function buildVerifySuccess(
  order: PaymentOrderRow,
  paymentId: string,
  paidAt: string,
  enrolled: boolean,
): VerifyPaymentResult {
  return {
    order_id: order.id,
    product_id: order.product_id,
    course_id: order.course_id,
    status: 'paid',
    enrolled,
    unlocked: true,
    purchased: true,
    razorpay_payment_id: paymentId,
    paid_at: paidAt,
  };
}

/**
 * POST /payments/verify — confirm Checkout result.
 *
 * Steps (all server-side):
 * 1. Verify HMAC signature — reject invalid signatures immediately
 * 2. Load our payment_orders row (must belong to caller)
 * 3. Fetch payment from Razorpay API (authoritative status + amount)
 * 4. Store payment (mark order paid)
 * 5. Insert purchases (+ course unlock when product_type=course)
 * 6. Return success response
 */
export async function verifyPayment(
  userId: string,
  input: VerifyPaymentInput,
  deps: PaymentServiceDeps = {},
): Promise<VerifyPaymentResult> {
  try {
    return await verifyPaymentInternal(userId, input, deps);
  } catch (err) {
    logger.payment(
      'Payment verification failed',
      {
        user_id: userId,
        razorpay_order_id: input.razorpay_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        code: err instanceof AppError ? err.code : 'PAYMENT_VERIFY_FAILED',
        message: err instanceof Error ? err.message : String(err),
        status: err instanceof AppError ? err.statusCode : 500,
      },
      err instanceof AppError && err.statusCode < 500 ? 'warn' : 'error',
    );
    throw err;
  }
}

async function verifyPaymentInternal(
  userId: string,
  input: VerifyPaymentInput,
  deps: PaymentServiceDeps = {},
): Promise<VerifyPaymentResult> {
  const orders = deps.orders ?? paymentOrderRepository;
  const products = deps.products ?? productRepository;
  const coursePurchases = deps.purchases ?? purchasedCourseRepository;
  const catalogPurchases = deps.catalogPurchases ?? purchaseRepository;

  verifyPaymentSignature({
    razorpay_order_id: input.razorpay_order_id,
    razorpay_payment_id: input.razorpay_payment_id,
    razorpay_signature: input.razorpay_signature,
  });

  const order = await orders.findByRazorpayOrderId(input.razorpay_order_id);
  if (!order) {
    throw new AppError(404, 'PAYMENT_ORDER_NOT_FOUND', 'Payment order not found');
  }
  if (order.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'This payment order belongs to another user');
  }

  async function resolveProductForOrder(row: PaymentOrderRow): Promise<ProductRow> {
    if (row.product_id) {
      const product = await products.findById(row.product_id);
      if (product) return product;
    }
    if (row.course_id) {
      return products.upsertCourseProduct({
        courseId: row.course_id,
        title:
          typeof row.metadata?.course_title === 'string'
            ? row.metadata.course_title
            : 'Course',
        price: row.amount_paise / 100,
        isActive: true,
      });
    }
    throw new AppError(500, 'PRODUCT_MISSING', 'Payment order has no product or course');
  }

  async function unlockOrder(row: PaymentOrderRow, paymentId: string, purchasedAt: string) {
    const product = await resolveProductForOrder(row);
    return unlockProductAfterPayment({
      userId,
      product,
      courseId: row.course_id,
      paymentOrderId: row.id,
      razorpayPaymentId: paymentId,
      amountPaise: row.amount_paise,
      currency: row.currency,
      purchasedAt,
      coursePurchases,
      catalogPurchases,
    });
  }

  if (order.status === 'paid') {
    const unlocked = await unlockOrder(
      order,
      order.razorpay_payment_id ?? input.razorpay_payment_id,
      order.paid_at ?? new Date().toISOString(),
    );
    return buildVerifySuccess(
      order,
      order.razorpay_payment_id ?? input.razorpay_payment_id,
      order.paid_at ?? new Date().toISOString(),
      unlocked.enrolled,
    );
  }

  if (order.status !== 'created') {
    throw new AppError(
      409,
      'PAYMENT_ORDER_NOT_PAYABLE',
      `Order status is ${order.status} and cannot be verified`,
    );
  }

  const payment = await fetchRazorpayPayment(input.razorpay_payment_id);

  if (payment.order_id !== input.razorpay_order_id) {
    throw new AppError(
      400,
      'PAYMENT_ORDER_MISMATCH',
      'Payment does not belong to the given Razorpay order',
    );
  }

  const okStatus = payment.status === 'captured' || payment.status === 'authorized';
  if (!okStatus) {
    await orders.markFailed(order.id);
    throw new AppError(
      402,
      'PAYMENT_NOT_SUCCESSFUL',
      `Razorpay payment status is "${payment.status}"`,
    );
  }

  if (Number(payment.amount) !== Number(order.amount_paise)) {
    await orders.markFailed(order.id);
    throw new AppError(
      400,
      'PAYMENT_AMOUNT_MISMATCH',
      'Paid amount does not match the server order amount',
    );
  }

  if (payment.currency && payment.currency.toUpperCase() !== order.currency) {
    await orders.markFailed(order.id);
    throw new AppError(400, 'PAYMENT_CURRENCY_MISMATCH', 'Currency mismatch');
  }

  const paidAt = new Date().toISOString();
  const updated = await orders.markPaid({
    id: order.id,
    razorpay_payment_id: input.razorpay_payment_id,
    razorpay_signature: input.razorpay_signature,
    paid_at: paidAt,
  });

  const unlocked = await unlockOrder(
    updated,
    input.razorpay_payment_id,
    updated.paid_at ?? paidAt,
  );

  const product = await resolveProductForOrder(updated);
  const productTitle =
    product.title ||
    (typeof updated.metadata?.product_title === 'string'
      ? updated.metadata.product_title
      : null) ||
    (typeof updated.metadata?.course_title === 'string'
      ? updated.metadata.course_title
      : 'Purchase');

  emitPaymentCompleted({
    user_id: userId,
    payment_order_id: updated.id,
    razorpay_payment_id: input.razorpay_payment_id,
    product_id: product.id,
    product_type: product.product_type,
    product_title: productTitle,
    course_id: updated.course_id ?? (product.product_type === 'course' ? product.product_id : null),
    amount_paise: updated.amount_paise,
    currency: updated.currency,
    enrolled: unlocked.enrolled,
  });

  const actorEmail = await resolveActorEmail(userId);
  await writeActivityLog({
    actor_id: userId,
    actor_email: actorEmail,
    action: 'payment.completed',
    entity_type: 'payment_order',
    entity_id: updated.id,
    summary: `Payment completed · ${productTitle} · ${formatInrFromPaise(updated.amount_paise)}`,
    metadata: {
      amount_paise: updated.amount_paise,
      currency: updated.currency,
      product_type: product.product_type,
      course_id: updated.course_id,
    },
  });

  if (unlocked.enrolled && (updated.course_id || product.product_type === 'course')) {
    await writeActivityLog({
      actor_id: userId,
      actor_email: actorEmail,
      action: 'course.purchase',
      entity_type: 'course',
      entity_id:
        updated.course_id ??
        (product.product_type === 'course' ? product.product_id : null),
      summary: `Course purchased · ${productTitle}`,
      metadata: {
        payment_order_id: updated.id,
        amount_paise: updated.amount_paise,
      },
    });
  }

  return buildVerifySuccess(
    updated,
    input.razorpay_payment_id,
    updated.paid_at ?? paidAt,
    unlocked.enrolled,
  );
}

function formatInrFromPaise(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

function toHistoryItem(
  row: PaymentOrderRow,
  title: string,
): import('@sharanam/shared').PurchaseHistoryItem {
  const productType =
    typeof row.metadata?.product_type === 'string'
      ? (row.metadata.product_type as import('@sharanam/shared').ProductType)
      : row.course_id
        ? 'course'
        : 'course';

  return {
    order_id: row.id,
    product_id: row.product_id,
    product_type: productType,
    course_id: row.course_id,
    course_title: title,
    title,
    amount_paise: row.amount_paise,
    amount_display: formatInrFromPaise(row.amount_paise),
    currency: row.currency,
    date: row.paid_at ?? row.created_at,
    payment_id: row.razorpay_payment_id,
    status: row.status,
    receipt_number: row.receipt,
  };
}

/**
 * GET /payments/history — Purchase History for the authenticated student.
 */
export async function listPurchaseHistory(
  userId: string,
  query: { page?: number; pageSize?: number; status?: string } = {},
  deps: PaymentServiceDeps = {},
): Promise<import('@sharanam/shared').PurchaseHistoryPage> {
  const orders = deps.orders ?? paymentOrderRepository;
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const { rows, total } = await orders.listByUserId(userId, { page, pageSize });
  const supabase = getSupabaseAdmin();

  const courseIds = [
    ...new Set(rows.map((row) => row.course_id).filter((id): id is string => Boolean(id))),
  ];
  const productIds = [
    ...new Set(rows.map((row) => row.product_id).filter((id): id is string => Boolean(id))),
  ];
  const titleMap = new Map<string, string>();

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title')
      .in('id', productIds);
    if (!error) {
      for (const product of data ?? []) {
        titleMap.set(product.id as string, product.title as string);
      }
    }
  }

  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    if (error) {
      throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
    }
    for (const course of data ?? []) {
      titleMap.set(`course:${course.id as string}`, course.title as string);
    }
  }

  const items = rows.map((row) => {
    const fromMeta =
      (typeof row.metadata?.product_title === 'string'
        ? row.metadata.product_title
        : null) ??
      (typeof row.metadata?.course_title === 'string' ? row.metadata.course_title : null);
    const title =
      (row.product_id ? titleMap.get(row.product_id) : undefined) ??
      (row.course_id ? titleMap.get(`course:${row.course_id}`) : undefined) ??
      fromMeta ??
      'Product';
    return toHistoryItem(row, title);
  });

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function receiptStatusLabel(status: PaymentOrderRow['status']): string {
  if (status === 'paid') return 'SUCCESS';
  if (status === 'failed') return 'FAILED';
  if (status === 'expired') return 'EXPIRED';
  return 'PENDING';
}

function buildReceiptText(input: {
  studentName: string;
  courseTitle: string;
  amountDisplay: string;
  paymentId: string;
  dateLabel: string;
  statusLabel: string;
}): string {
  return [
    'SHARANAM CLASSES',
    '',
    'Receipt',
    '',
    'Student',
    input.studentName,
    '',
    'Course',
    input.courseTitle,
    '',
    'Amount',
    input.amountDisplay,
    '',
    'Payment ID',
    input.paymentId,
    '',
    'Date',
    input.dateLabel,
    '',
    'Status',
    input.statusLabel,
    '',
  ].join('\n');
}

/**
 * GET /receipt/:paymentId — text receipt (Razorpay pay_… or internal order UUID).
 * Legacy: GET /payments/history/:orderId/receipt
 */
export async function getPurchaseReceipt(
  userId: string,
  orderIdOrPaymentId: string,
  deps: PaymentServiceDeps = {},
): Promise<import('@sharanam/shared').PurchaseReceipt> {
  const orders = deps.orders ?? paymentOrderRepository;

  let row = await orders.findById(orderIdOrPaymentId);
  if (!row) {
    row = await orders.findByRazorpayPaymentId(orderIdOrPaymentId);
  }

  if (!row || row.user_id !== userId) {
    throw new AppError(404, 'RECEIPT_NOT_FOUND', 'Receipt not found');
  }

  const supabase = getSupabaseAdmin();
  const [{ data: course }, { data: profile }, { data: product }] = await Promise.all([
    row.course_id
      ? supabase.from('courses').select('title').eq('id', row.course_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    row.product_id
      ? supabase.from('products').select('title').eq('id', row.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const fromMeta =
    (typeof row.metadata?.product_title === 'string'
      ? row.metadata.product_title
      : null) ??
    (typeof row.metadata?.course_title === 'string' ? row.metadata.course_title : null);
  const courseTitle =
    (product?.title as string | undefined) ??
    (course?.title as string | undefined) ??
    fromMeta ??
    'Product';
  const studentName =
    (typeof profile?.full_name === 'string' && profile.full_name.trim()) || 'Student';
  const item = toHistoryItem(row, courseTitle);

  const receiptText = buildReceiptText({
    studentName,
    courseTitle: item.title,
    amountDisplay: item.amount_display,
    paymentId: item.payment_id ?? '—',
    dateLabel: formatReceiptDate(item.date),
    statusLabel: receiptStatusLabel(row.status),
  });

  const safeId = (item.payment_id ?? item.receipt_number ?? item.order_id).replace(
    /[^a-zA-Z0-9_-]/g,
    '',
  );

  return {
    order_id: item.order_id,
    filename: `sharanam-receipt-${safeId}.txt`,
    content_type: 'text/plain',
    receipt_text: receiptText,
    student_name: studentName,
    item,
  };
}
