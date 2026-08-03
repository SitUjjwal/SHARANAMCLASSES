/**
 * paymentOrder.repository.ts
 *
 * Data-access layer for `payment_orders` (PostgreSQL via Supabase).
 * Services never call Supabase for this table directly — keeps SQL/vendor
 * details out of business rules and makes unit tests mockable.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type PaymentOrderRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  product_id: string | null;
  amount_paise: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'expired';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  receipt: string;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, user_id, course_id, product_id, amount_paise, currency, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt, metadata, paid_at, created_at, updated_at';

export type InsertPaymentOrderInput = {
  user_id: string;
  /** Required for course checkouts; null for future non-course products */
  course_id?: string | null;
  product_id: string;
  amount_paise: number;
  currency: string;
  receipt: string;
  razorpay_order_id: string;
  metadata?: Record<string, unknown>;
};

export type PaymentOrderListPage = {
  rows: PaymentOrderRow[];
  total: number;
  page: number;
  pageSize: number;
};

export interface IPaymentOrderRepository {
  insert(input: InsertPaymentOrderInput): Promise<PaymentOrderRow>;
  findById(id: string): Promise<PaymentOrderRow | null>;
  findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrderRow | null>;
  findByRazorpayPaymentId(razorpayPaymentId: string): Promise<PaymentOrderRow | null>;
  listByUserId(
    userId: string,
    options?: { page?: number; pageSize?: number },
  ): Promise<PaymentOrderListPage>;
  markPaid(input: {
    id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paid_at: string;
  }): Promise<PaymentOrderRow>;
  markFailed(id: string): Promise<void>;
}

export const paymentOrderRepository: IPaymentOrderRepository = {
  async insert(input) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_orders')
      .insert({
        user_id: input.user_id,
        course_id: input.course_id ?? null,
        product_id: input.product_id,
        amount_paise: input.amount_paise,
        currency: input.currency,
        receipt: input.receipt,
        razorpay_order_id: input.razorpay_order_id,
        status: 'created',
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .select(COLUMNS)
      .single();

    if (error) {
      throw new AppError(400, 'PAYMENT_ORDER_CREATE_FAILED', error.message);
    }
    return data as PaymentOrderRow;
  },

  async findById(id) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_orders')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PAYMENT_ORDER_FETCH_FAILED', error.message);
    }
    return (data as PaymentOrderRow | null) ?? null;
  },

  async findByRazorpayOrderId(razorpayOrderId) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_orders')
      .select(COLUMNS)
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PAYMENT_ORDER_FETCH_FAILED', error.message);
    }
    return (data as PaymentOrderRow | null) ?? null;
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_orders')
      .select(COLUMNS)
      .eq('razorpay_payment_id', razorpayPaymentId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PAYMENT_ORDER_FETCH_FAILED', error.message);
    }
    return (data as PaymentOrderRow | null) ?? null;
  },

  async listByUserId(userId, options?: { page?: number; pageSize?: number }) {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('payment_orders')
      .select(COLUMNS, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new AppError(500, 'PAYMENT_HISTORY_FETCH_FAILED', error.message);
    }
    return {
      rows: (data ?? []) as PaymentOrderRow[],
      total: count ?? (data ?? []).length,
      page,
      pageSize,
    };
  },

  async markPaid(input) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        razorpay_payment_id: input.razorpay_payment_id,
        razorpay_signature: input.razorpay_signature,
        paid_at: input.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select(COLUMNS)
      .single();

    if (error) {
      throw new AppError(400, 'PAYMENT_ORDER_UPDATE_FAILED', error.message);
    }
    return data as PaymentOrderRow;
  },

  async markFailed(id) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new AppError(400, 'PAYMENT_ORDER_UPDATE_FAILED', error.message);
    }

    try {
      const { metricsStore } = await import('../monitoring/metricsStore');
      metricsStore.recordFailedPayment();
    } catch {
      // monitoring is best-effort
    }
  },
};
