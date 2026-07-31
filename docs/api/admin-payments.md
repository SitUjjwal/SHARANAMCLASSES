# Admin Payment Management

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <admin_supabase_access_token>`  
Role: admin (`requireAuth` + `requireAdmin`)

---

## Architecture

```
Admin UI (PaymentsPage)
        │
        ▼
  features/payments/api.ts
        │  GET /admin/payments/stats
        │  GET /admin/payments?search&status&page
        │  GET /admin/payments/export
        ▼
  payment.routes.ts  →  payment.controller.ts
        │
        ▼
  paymentAdmin.service.ts
        │  KPIs + list + CSV (Asia/Kolkata day/month)
        ▼
  Supabase admin client
        │
        ├── payment_orders   (amount_paise, status, paid_at, …)
        ├── courses          (title)
        └── profiles         (email)
```

**Source of truth:** `payment_orders` only. Revenue sums `amount_paise` where `status = paid` and `paid_at` falls in the day/month window (timezone **Asia/Kolkata**). Pending = `created`; Failed = `failed`. Amounts are never taken from the client.

Student checkout / verify stay on `payment.service.ts` + Razorpay. Admin reads are separate so KPI queries do not couple to Checkout.

---

## Endpoints

### `GET /admin/payments/stats`

**Response**

```json
{
  "success": true,
  "data": {
    "today_revenue_paise": 99800,
    "today_revenue_display": "₹998",
    "monthly_revenue_paise": 499000,
    "monthly_revenue_display": "₹4,990",
    "total_orders": 42,
    "pending_payments": 3,
    "failed_payments": 2,
    "paid_orders": 37,
    "timezone": "Asia/Kolkata"
  }
}
```

### `GET /admin/payments`

Query: `search`, `status` (`all|created|paid|failed|expired`), `page`, `pageSize` (max 100).

**Response:** `{ items, page, pageSize, total, hasMore }` — each item includes course title, student email, amount, status, payment id, date.

### `GET /admin/payments/export`

Same filters as list (no pagination). Returns `{ filename, csv }` (up to 1000 rows). Admin UI triggers a browser download.

---

## Admin UI

Route: `/payments`

Displays: Today’s Revenue, Orders, Successful, Failed — plus search, status filter, table, Export CSV.
