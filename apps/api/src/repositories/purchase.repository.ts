/**
 * purchase.repository.ts
 *
 * Generic purchase ledger (`purchases`) for any product type.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type PurchaseRow = {
  id: string;
  user_id: string;
  product_id: string;
  payment_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  purchased_at: string;
  created_at: string;
};

export type InsertPurchaseInput = {
  user_id: string;
  product_id: string;
  payment_order_id: string;
  razorpay_payment_id: string;
  amount_paise: number;
  currency: string;
  purchased_at?: string;
};

export interface IPurchaseRepository {
  findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<PurchaseRow | null>;
  insert(input: InsertPurchaseInput): Promise<PurchaseRow>;
}

const COLUMNS =
  'id, user_id, product_id, payment_order_id, razorpay_payment_id, amount_paise, currency, purchased_at, created_at';

export const purchaseRepository: IPurchaseRepository = {
  async findByUserAndProduct(userId, productId) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('purchases')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('purchases') && msg.includes('does not exist')) {
        return null;
      }
      throw new AppError(500, 'PURCHASE_FETCH_FAILED', error.message);
    }
    return (data as PurchaseRow | null) ?? null;
  },

  async insert(input) {
    const supabase = getSupabaseAdmin();
    const purchasedAt = input.purchased_at ?? new Date().toISOString();

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: input.user_id,
        product_id: input.product_id,
        payment_order_id: input.payment_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        amount_paise: input.amount_paise,
        currency: input.currency,
        purchased_at: purchasedAt,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') {
        const existing = await purchaseRepository.findByUserAndProduct(
          input.user_id,
          input.product_id,
        );
        if (existing) return existing;
      }
      throw new AppError(400, 'PURCHASE_CREATE_FAILED', error.message);
    }

    return data as PurchaseRow;
  },
};
