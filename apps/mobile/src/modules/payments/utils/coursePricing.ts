/**
 * Course pricing breakdown for the Buy Course screen.
 *
 * - listPrice  → "Price" (MRP / compare-at when present)
 * - discount   → listPrice − finalAmount
 * - finalAmount → what Razorpay charges (courses.price from server)
 */
export type BuyCoursePricing = {
  listPrice: number;
  discount: number;
  finalAmount: number;
  discountPercent: number;
};

export function getBuyCoursePricing(course: {
  price: number;
  is_free: boolean;
  /** Optional MRP; when higher than price, shows as discount */
  compare_at_price?: number | null;
}): BuyCoursePricing {
  const finalAmount = course.is_free ? 0 : Math.max(0, Number(course.price) || 0);
  const compare = Number(course.compare_at_price);
  const listPrice =
    Number.isFinite(compare) && compare > finalAmount ? compare : finalAmount;
  const discount = Math.max(0, Math.round((listPrice - finalAmount) * 100) / 100);
  const discountPercent =
    listPrice > 0 && discount > 0 ? Math.round((discount / listPrice) * 100) : 0;

  return { listPrice, discount, finalAmount, discountPercent };
}
