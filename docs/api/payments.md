# Payments API (Razorpay)

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

**Security rule:** Never trust frontend payment status or amount. The server sets the amount from `courses.price`, verifies the Checkout HMAC, then fetches the payment from Razorpay’s API before marking paid and enrolling.

---

## File map (what each file does)

| File | Role |
|------|------|
| `infra/supabase/migrations/20260801010000_payment_orders.sql` | PostgreSQL table `payment_orders` + RLS (own-row select) |
| `apps/api/src/config/env.ts` | Loads `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| `apps/api/src/integrations/razorpay/client.ts` | Razorpay SDK adapter — create order, fetch payment |
| `apps/api/src/integrations/razorpay/signature.ts` | HMAC-SHA256 Checkout + webhook signature verify |
| `apps/api/src/integrations/razorpay/index.ts` | Public barrel for the adapter |
| `apps/api/src/repositories/paymentOrder.repository.ts` | Supabase CRUD for `payment_orders` |
| `apps/api/src/repositories/index.ts` | Repository exports |
| `apps/api/src/validators/payment.validators.ts` | Zod schemas (create order / verify) |
| `apps/api/src/services/payment.service.ts` | Business rules: price → order → verify → enroll |
| `apps/api/src/controllers/payment.controller.ts` | HTTP handlers |
| `apps/api/src/routes/payment.routes.ts` | Canonical student payment routes |
| `apps/api/src/services/course.service.ts` | Free enroll only; paid → `402 PAYMENT_REQUIRED` |
| `packages/shared/src/types/course.ts` | `PaymentOrder`, `CreatePaymentOrderResult`, `VerifyPaymentResult` |
| `apps/api/tests/payments/*.test.ts` | Signature + service unit tests |
| `apps/api/vitest.config.ts` | Test runner + test Razorpay env |

---

## Environment

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=   # optional; for future webhook route
```

- **Production:** both key id and secret are required (API exits if missing).
- Clients receive **key_id only** in the create-order response.

Apply migrations:

1. `20260801010000_payment_orders.sql`
2. `20260801020000_purchased_courses.sql`
3. `20260801040000_products_catalog.sql` — generic `products` + `purchases` (see [products.md](./products.md))

See also [payment-verification.md](./payment-verification.md) for the verify security model.

---

## Student API contract

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/payments/create-order` | Create Razorpay order (amount from DB) |
| `POST` | `/payments/verify` | Verify HMAC + unlock course |
| `GET` | `/payments/history` | Purchase history |
| `GET` | `/my-courses` | Owned courses (see my-courses guide) |
| `GET` | `/orders` | Same as history (orders list) |
| `GET` | `/receipt/:paymentId` | Download receipt (`pay_…` or order UUID) |

Legacy aliases: `POST /payments/orders`, `GET /payments/history/:orderId/receipt`.

---

## APIs

### `POST /payments/create-order`

Body (either field):

```json
{ "product_id": "uuid" }
```

```json
{ "course_id": "uuid" }
```

`course_id` upserts a catalog `products` row (`product_type=course`) then creates the order. Prefer `product_id` for new clients / non-course SKUs.
Server:

1. Loads published course; rejects free courses (`COURSE_IS_FREE`)
2. Rejects if already enrolled
3. Amount = `round(price * 100)` paise (client cannot set amount)
4. Creates Razorpay order + inserts `payment_orders` row

Response `data`:

```json
{
  "order_id": "uuid",
  "razorpay_order_id": "order_…",
  "amount_paise": 49900,
  "currency": "INR",
  "key_id": "rzp_test_…",
  "course_id": "uuid",
  "course_title": "…",
  "receipt": "sc_…"
}
```

Open Razorpay Checkout with `key_id`, `razorpay_order_id`, `amount_paise`.

---

### `POST /payments/verify`

Body (from Checkout success handler):

```json
{
  "razorpay_order_id": "order_…",
  "razorpay_payment_id": "pay_…",
  "razorpay_signature": "…"
}
```

Server:

1. Verifies HMAC `order_id|payment_id` with **key secret** (timing-safe)
2. Loads our `payment_orders` row (must belong to the auth user)
3. Fetches payment from Razorpay API — requires `captured` or `authorized`
4. Checks amount + currency match the stored order
5. Marks order `paid`, creates enrollment (idempotent)

---

### `GET /payments/history` · `GET /orders`

Same payload — caller’s `payment_orders` newest first. See [purchase-history.md](./purchase-history.md).

### `GET /receipt/:paymentId`

Lookup by Razorpay `pay_…` **or** internal order UUID. Own rows only.

### Free vs paid enroll

| Course | Path |
|--------|------|
| Free (`is_free` or `price <= 0`) | `POST /courses/:id/enroll` |
| Paid | `POST /payments/create-order` → Checkout → `POST /payments/verify` |

Paid `POST /courses/:id/enroll` → `402 PAYMENT_REQUIRED`.

---

## Tests

```bash
cd apps/api && npm test
```
