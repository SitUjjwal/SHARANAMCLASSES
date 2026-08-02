# Module 7+ — Event-driven Notifications

Features emit domain events after successful writes. The Notification Service
subscribes and sends push — features never call FCM/Expo directly.

---

## Architecture

```
Payment Success                 Course Published / Updated
       │                                   │
       ▼                                   ▼
Event: payment.completed            Event: course.updated
       │                                   │
       └──────────────┬────────────────────┘
                      ▼
              Domain EventBus (in-process)
                      │
                      ▼
           Notification handlers
                      │
                      ▼
        createAndMaybeSendNotification
                      │
                      ▼
              FCM / Expo + inbox
```

| Layer | Responsibility |
|-------|----------------|
| Feature services (`payment`, `course`, `chapter`, `liveClass`) | Persist domain state, then `emit*` |
| `events/bus.ts` | Typed pub/sub (`on` / `publish`) |
| `events/handlers/notification.handlers.ts` | Map event → campaign + `send: true` |
| Notification Service | Audience resolve, devices, delivery status |
| Reminder Engine | Still a **scheduled job** layer (not domain events); may emit later |

Admin compose (`POST /notifications`) stays a direct Notification Service call —
that *is* the notification feature.

---

## Event catalog

| Event | Emitter | Audience | `notification_type` |
|-------|---------|----------|---------------------|
| `payment.completed` | `verifyPayment` (first paid unlock) | payer | `payment` |
| `course.updated` | `updateCourse` | all users if just published; else course enrollments | `course_update` |
| `chapter.published` | `createChapter` / publish flip | course enrollments | `course_update` |
| `live_class.scheduled` | `createLiveClass` (published) | course / all | `live_class` |
| `test.scheduled` | reserved | course / all | `test_reminder` |

Payloads live in `@sharanam/shared` → `types/events.ts`.

---

## Files

| Path | Role |
|------|------|
| `packages/shared/src/types/events.ts` | Event names + payloads |
| `apps/api/src/events/bus.ts` | In-process bus |
| `apps/api/src/events/emit.ts` | Typed `emitPaymentCompleted`, … |
| `apps/api/src/events/handlers/notification.handlers.ts` | Subscribers |
| `apps/api/src/events/register.ts` | Boot registration |
| `infra/supabase/migrations/20260802160000_notification_type_payment.sql` | `payment` type |

---

## Rules

1. **Emit after commit** — only after the DB write succeeds.
2. **Fire-and-forget** — `emit*` must not block or fail the HTTP request if push fails.
3. **No FCM in features** — only Notification Service (and Reminder jobs) send.
4. **Idempotency keys** — set on events (`payment:{orderId}`) for a future outbox.
5. **Already-paid re-verify** does **not** re-emit `payment.completed` (avoids spam).

---

## Scaling path

Today: in-process `EventBus` (single API process).

Next steps without changing emit sites:

1. Persist events to an `event_outbox` table in the same transaction
2. Worker drains outbox → Redis/SQS/Kafka
3. Multiple Notification Service consumers

---

## Example

```ts
// payment.service.ts (after markPaid + unlock)
emitPaymentCompleted({
  user_id,
  payment_order_id,
  razorpay_payment_id,
  product_id,
  product_type,
  product_title,
  course_id,
  amount_paise,
  currency,
  enrolled,
});

// course.service.ts (after update)
emitCourseUpdated({
  course_id,
  title,
  is_published,
  previous_is_published,
  updated_fields,
});
```
