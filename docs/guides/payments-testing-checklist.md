# Module 5 — Payments testing checklist

Use this after applying payment migrations and restarting `apps/api`.

Legend: **Auto** = covered by unit tests / tooling · **Manual** = smoke in app / admin

---

## Payment

| Check | How | Status |
|-------|-----|--------|
| Order created | Auto: `createPaymentOrder` tests · Manual: Buy Course → Checkout | Auto ✅ |
| Razorpay checkout opens | Manual: mobile Buy Course with test keys | Manual |
| Signature verified | Auto: `verifyPayment` + signature tests | Auto ✅ |
| Invalid signature rejected | Auto: `INVALID_PAYMENT_SIGNATURE` | Auto ✅ |

## Purchase

| Check | How | Status |
|-------|-----|--------|
| Purchased course unlocked | Auto: `isMediaLocked(true, …)` · Manual: open paid video after verify | Auto ✅ |
| Non-purchased course locked | Auto: `isMediaLocked(false, false)` → locked | Auto ✅ |
| Free preview works | Auto: `isMediaLocked(false, true)` → unlocked | Auto ✅ |

## Student

| Check | How | Status |
|-------|-----|--------|
| My Courses loads | Manual: My Courses tab → `GET /my-courses` | Manual |
| Purchase History loads | Manual: Profile → Purchase History → `GET /payments/history` | Manual |
| Receipt downloads | Manual: Download Receipt → `GET /receipt/:paymentId` | Manual |

## Admin

| Check | How | Status |
|-------|-----|--------|
| Revenue dashboard updates | Manual: Admin → Payments KPIs after a paid order | Manual |
| Payment search works | Manual: search box on Payments page | Manual |
| CSV export works | Manual: Export CSV button | Manual |

## Code

| Check | How | Status |
|-------|-----|--------|
| No TypeScript errors | `packages/shared` build + api/admin/mobile `typecheck` | ✅ (after shared rebuild) |
| No ESLint errors | api/admin/mobile `lint` | ✅ |
| API documentation updated | payments, verification, purchase-history, admin-payments, course-access, content, buy-course guide | ✅ |

---

## Commands

```bash
cd packages/shared && npm run build
cd apps/api && npm test && npm run typecheck && npm run lint
cd apps/admin && npm run typecheck && npm run lint
cd apps/mobile && npm run typecheck && npm run lint
```

## Manual smoke (happy path)

1. Apply migrations: `payment_orders`, `purchased_courses`, `enrollment_last_watched`
2. Restart API with Razorpay test keys
3. Mobile: buy a paid course → Checkout → Success → My Courses shows course
4. Unpurchased course: paid video locked; `is_free` video plays
5. Purchase History → Download Receipt (SHARANAM CLASSES layout)
6. Admin `/payments`: today’s revenue, search, Export CSV
