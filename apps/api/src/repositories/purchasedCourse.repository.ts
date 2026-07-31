/**
 * purchasedCourse.repository.ts
 *
 * Persists paid unlocks into `purchased_courses` after Razorpay verification.
 * Unique (user_id, course_id) makes inserts idempotent on verify retries.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type PurchasedCourseRow = {
  id: string;
  user_id: string;
  course_id: string;
  payment_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  purchased_at: string;
  created_at: string;
};

export type InsertPurchasedCourseInput = {
  user_id: string;
  course_id: string;
  payment_order_id: string;
  razorpay_payment_id: string;
  amount_paise: number;
  currency: string;
  purchased_at?: string;
};

export interface IPurchasedCourseRepository {
  findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<PurchasedCourseRow | null>;
  insert(input: InsertPurchasedCourseInput): Promise<PurchasedCourseRow>;
}

const COLUMNS =
  'id, user_id, course_id, payment_order_id, razorpay_payment_id, amount_paise, currency, purchased_at, created_at';

export const purchasedCourseRepository: IPurchasedCourseRepository = {
  async findByUserAndCourse(userId, courseId) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('purchased_courses')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'PURCHASE_FETCH_FAILED', error.message);
    }
    return (data as PurchasedCourseRow | null) ?? null;
  },

  async insert(input) {
    const supabase = getSupabaseAdmin();
    const purchasedAt = input.purchased_at ?? new Date().toISOString();

    const { data, error } = await supabase
      .from('purchased_courses')
      .insert({
        user_id: input.user_id,
        course_id: input.course_id,
        payment_order_id: input.payment_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        amount_paise: input.amount_paise,
        currency: input.currency,
        purchased_at: purchasedAt,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      // Already purchased — treat as success (idempotent verify)
      if (error.code === '23505') {
        const existing = await purchasedCourseRepository.findByUserAndCourse(
          input.user_id,
          input.course_id,
        );
        if (existing) return existing;
      }
      throw new AppError(400, 'PURCHASE_CREATE_FAILED', error.message);
    }

    return data as PurchasedCourseRow;
  },
};
