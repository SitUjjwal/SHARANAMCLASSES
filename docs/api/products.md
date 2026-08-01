# Products catalog (generic payments)

Sell Bihar Board courses today — and test series, e-books, Spoken English, subscriptions later — without redesigning checkout.

---

## Model

```
products
---------
id              ← catalog SKU (orders reference this)
product_type    ← course | test_series | spoken_english | ebook | subscription
product_id      ← entity id (e.g. courses.id)
title
price           ← INR rupees (server source of truth)
currency
is_active
```

```
payment_orders.product_id  → products.id
payment_orders.course_id   → courses.id (nullable; set when product_type=course)

purchases                  → generic paid unlock ledger (any type)
purchased_courses          → still written for course unlocks (content / My Courses)
enrollments                → course content gate
```

---

## Create order

`POST /payments/create-order`

```json
{ "product_id": "uuid" }
```

or legacy:

```json
{ "course_id": "uuid" }
```

- `course_id` → upserts a `products` row (`product_type=course`) then creates the Razorpay order  
- Amount always from `products.price` (synced from `courses.price` for courses)  
- Client never sends amount

---

## Verify unlock

After signature + Razorpay verify:

1. Insert `purchases` (always)
2. If `product_type=course` → also `purchased_courses` + `enrollments`

Future types only need a new unlock branch (e.g. grant test-series access).

---

## Migration

Apply in Supabase SQL Editor:

`infra/supabase/migrations/20260801040000_products_catalog.sql`

(after payment_orders + purchased_courses migrations)

---

## Future products

| Type | `product_type` | Entity table (later) |
|------|----------------|----------------------|
| Courses | `course` | `courses` |
| Test Series | `test_series` | `tests` (see [tests.md](./tests.md)) |
| E-books | `ebook` | e.g. `ebooks` |
| Spoken English | `spoken_english` | e.g. `spoken_programs` |
| Premium | `subscription` | e.g. `subscription_plans` |

Insert a `products` row pointing at the entity, then call create-order with that `product_id`.
