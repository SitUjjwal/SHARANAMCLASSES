# Module 7 — Reminder Engine

Scheduled jobs that automatically create + send notifications via the Notification Service.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  API process (server.ts)                                    │
│                                                             │
│  node-cron  ──every 15m (Asia/Kolkata)──►  runReminderTick  │
│       │                                         │           │
│       │                    ┌────────────────────┼────────┐  │
│       │                    ▼                    ▼        ▼  │
│       │         live_upcoming  test_tomorrow  expiry …     │
│       │                    │                                │
│       │                    ▼                                │
│       │         tryClaimReminder (reminder_dispatches)      │
│       │                    │ unique key = idempotent        │
│       │                    ▼                                │
│       │         createAndMaybeSendNotification (send:true)  │
│       │                    │                                │
│       │                    ▼                                │
│       │         FCM / Expo + inbox (existing pipeline)      │
└─────────────────────────────────────────────────────────────┘

Manual: POST /admin/reminders/tick?dry_run=true
```

| Job | Trigger | Audience | `notification_type` | Idempotency key |
|-----|---------|----------|---------------------|-----------------|
| Upcoming Live Classes | `start_time` ≈ now + 60m (± window) | course enrollments (or all) | `live_class` | `t-60m` |
| Tomorrow's Tests | `tests.scheduled_at` is calendar tomorrow | course / all | `test_reminder` | `day_before:YYYY-MM-DD` |
| Course Expiry | `purchased_courses.expires_at` in 7/3/1 days | buyer (`single_user`) | `course_expiry` | `d-7` / `d-3` / `d-1` |
| New Chapters | published chapter `created_at` within lookback | course enrollments | `course_update` | `published` |
| Missed Classes | live class `end_time` in last N hours | course enrollments | `missed_class` | `ended` |

**Idempotency:** `reminder_dispatches` unique on `(reminder_type, entity_id, reminder_key)`. Claim = insert; conflict = skip. Then send + attach `notification_id`.

**Missed classes note:** There is no attendance table yet, so this is a soft post-class nudge to all course enrollees—not verified absentees.

---

## Schema

Migration: `infra/supabase/migrations/20260802150000_reminder_engine.sql`

- `reminder_dispatches` ledger (RLS deny-all; service role only)
- `tests.scheduled_at` (optional — required for tomorrow-test job)
- `purchased_courses.expires_at` (optional — required for expiry job)
- Expands `notifications.notification_type` with `course_expiry`, `missed_class`

Apply in Supabase SQL editor / CLI before relying on jobs.

---

## Files

| File | Role |
|------|------|
| `apps/api/src/jobs/reminderEngine/scheduler.ts` | `node-cron` bootstrap |
| `apps/api/src/jobs/reminderEngine/runTick.ts` | Orchestrator + overlap mutex |
| `apps/api/src/jobs/reminderEngine/handlers/*` | Five job handlers |
| `apps/api/src/jobs/reminderEngine/dispatchLedger.ts` | Claim / attach |
| `apps/api/src/routes/reminder.routes.ts` | Admin HTTP |
| `apps/api/src/server.ts` | Starts scheduler on listen |

---

## Env

| Variable | Default | Meaning |
|----------|---------|---------|
| `REMINDER_ENGINE_ENABLED` | on (off in test) | Master switch |
| `REMINDER_ENGINE_CRON` | `*/15 * * * *` | Schedule |
| `REMINDER_ENGINE_TZ` | `Asia/Kolkata` | Cron + calendar math |
| `REMINDER_LIVE_LEAD_MINUTES` | `60` | Minutes before live start |
| `REMINDER_LIVE_WINDOW_MINUTES` | `12` | Half-window around lead |
| `REMINDER_EXPIRY_DAYS` | `7,3,1` | Expiry milestones |
| `REMINDER_CHAPTER_LOOKBACK_HOURS` | `36` | New-chapter scan |
| `REMINDER_MISSED_LOOKBACK_HOURS` | `3` | Ended-class scan |

---

## Admin API

### Status

`GET /admin/reminders/status` (auth + admin)

Returns resolved config.

### Manual tick

`POST /admin/reminders/tick?dry_run=true` (auth + admin)

- `dry_run=true` — scan only (no claim / send)
- omit / `false` — full claim + notify

Response includes per-handler `scanned`, `claimed`, `sent`, `skipped`, `errors`.

---

## Ops checklist

1. Apply migration `20260802150000_reminder_engine.sql`
2. Set `scheduled_at` on tests you want tomorrow-reminded
3. Set `expires_at` on purchases that should warn
4. Restart API so `startReminderScheduler()` runs
5. Smoke: `POST /admin/reminders/tick?dry_run=true`
