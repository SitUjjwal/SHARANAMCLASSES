# Payment verification — security

Endpoint: `POST /payments/verify`  
Auth: `Authorization: Bearer <supabase_access_token>`

---

## What verification does

1. **Verify Razorpay signature** — HMAC-SHA256(`order_id|payment_id`, `RAZORPAY_KEY_SECRET`) with timing-safe compare. Invalid → `400 INVALID_PAYMENT_SIGNATURE` (no unlock).
2. **Load our order** — must exist in `payment_orders` and belong to the authenticated user.
3. **Fetch payment from Razorpay** — authoritative `captured` / `authorized`; amount + currency must match the server order.
4. **Store payment** — update `payment_orders` (`status=paid`, payment id, signature, `paid_at`).
5. **Unlock course**
   - Insert **`purchased_courses`** (purchase ledger)
   - Insert **`enrollments`** (content access / My Learning)
6. **Return success**

```json
{
  "success": true,
  "message": "Payment verified. Course unlocked.",
  "data": {
    "order_id": "…",
    "course_id": "…",
    "status": "paid",
    "enrolled": true,
    "unlocked": true,
    "purchased": true,
    "razorpay_payment_id": "pay_…",
    "paid_at": "…"
  }
}
```

---

## Security (why this design)

| Threat | Mitigation |
|--------|------------|
| Client lies “payment success” | Signature required; payment re-fetched from Razorpay API |
| Tampered order/payment ids | HMAC must match `KEY_SECRET` (never shipped to mobile) |
| Timing attacks on signature | `crypto.timingSafeEqual` |
| Wrong amount charged | Compare Razorpay `amount` to stored `amount_paise` (priced at create-order) |
| Order stealing | Order `user_id` must equal auth user |
| Replay / double verify | Idempotent: paid orders re-ensure purchase + enrollment |
| Free unlock without pay | Unlock only after signature + capture checks |

**Never trust the frontend for amount or payment status.**

---

## Migrations

1. `20260801010000_payment_orders.sql`
2. `20260801020000_purchased_courses.sql` ← apply in Supabase SQL Editor

---

## Files

| File | Role |
|------|------|
| `integrations/razorpay/signature.ts` | HMAC verify / reject |
| `services/payment.service.ts` | `verifyPayment` orchestration |
| `repositories/paymentOrder.repository.ts` | Store payment on order |
| `repositories/purchasedCourse.repository.ts` | Insert `purchased_courses` |
| `controllers/payment.controller.ts` | HTTP success envelope |
