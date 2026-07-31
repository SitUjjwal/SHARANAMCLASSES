# Purchase History / Orders / Receipt

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

---

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/payments/history` | Purchase history |
| `GET` | `/orders` | Same payload as history |
| `GET` | `/receipt/:paymentId` | Receipt by `pay_…` or order UUID |
| `GET` | `/my-courses` | Owned courses (separate module) |

Legacy: `GET /payments/history/:orderId/receipt`

---

### `GET /payments/history` · `GET /orders`

Returns the authenticated user’s payment orders (newest first).

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "order_id": "uuid",
        "course_id": "uuid",
        "course_title": "Class 10 Maths",
        "amount_paise": 49900,
        "amount_display": "₹499",
        "currency": "INR",
        "date": "2026-08-01T10:30:00.000Z",
        "payment_id": "pay_…",
        "status": "paid",
        "receipt_number": "sc_…"
      }
    ]
  }
}
```

| Field | UI |
|-------|-----|
| `course_title` | Course |
| `amount_display` | Amount |
| `date` | Date (`paid_at` or `created_at`) |
| `payment_id` | Payment ID (Razorpay) |
| `status` | Status (`created` / `paid` / `failed` / `expired`) |

Source table: `payment_orders` (only the caller’s rows).

---

### `GET /receipt/:paymentId`

Builds a plain-text receipt for **Download Receipt**.

Accepts:
- Razorpay payment id (`pay_…`) — preferred
- Internal `payment_orders.id` (UUID)

**Response**

```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "filename": "sharanam-receipt-pay_xxx.txt",
    "content_type": "text/plain",
    "student_name": "Ujjwal Sharan",
    "receipt_text": "SHARANAM CLASSES\n\nReceipt\n\nStudent\nUjjwal Sharan\n…",
    "item": { /* same shape as history item */ }
  }
}
```

### Receipt example (`receipt_text`)

```
SHARANAM CLASSES

Receipt

Student
Ujjwal Sharan

Course
Class 10 Mathematics

Amount
₹499

Payment ID
pay_xxxxxxxxx

Date
31 July 2026

Status
SUCCESS
```

| Field | Source |
|-------|--------|
| Student | `profiles.full_name` |
| Course | `courses.title` |
| Amount | `amount_paise` → ₹ display |
| Payment ID | Razorpay `pay_…` |
| Date | `paid_at` (Asia/Kolkata), e.g. `31 July 2026` |
| Status | `paid` → `SUCCESS` |

Mobile writes `receipt_text` to a cache file and opens the system share sheet.

**Security:** 404 if the order is missing or belongs to another user.

---

## Mobile entry

**Profile → Purchase History**

React Query key: `queryKeys.purchaseHistory` (`['payments', 'history']`), invalidated after a successful payment verify.
