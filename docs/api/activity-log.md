# Activity Log

Central audit trail for SHARANAM CLASSES.

## What is stored

| Category | Actions |
|----------|---------|
| **Login / Logout** | `auth.login`, `auth.logout` (admin + mobile clients) |
| **Payment** | `payment.completed` |
| **Profile Update** | `profile.update` (self-service) |
| **Course Purchase** | `course.purchase` (paid), `course.enroll` (free) |
| **Admin Actions** | settings, student suspend/activate/reset/update, teacher CRUD/assign |

Table: `admin_activity_logs` (migration `20260803010000_admin_activity_settings.sql`)

Columns: `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `summary`, `metadata`, `created_at`

## Architecture

```
Events
  ├─ Client POST /activity/events   → auth.login / auth.logout (self only)
  ├─ payment.service verifyPayment  → payment.completed + course.purchase
  ├─ profile.service update         → profile.update
  ├─ course.service enroll          → course.enroll
  └─ admin services                 → student.* / teacher.* / settings.update
        │
        ▼
activityLog.service.writeActivityLog  (service role, best-effort)
        │
        ▼
admin_activity_logs (RLS deny-all)
        │
Admin UI /activity-logs
  GET /admin/activity-logs?category=&action=&search=&page=
  GET /admin/activity-logs/export
```

## Filters & pagination

| Query | Notes |
|-------|--------|
| `category` | `auth` \| `payment` \| `profile` \| `course` \| `admin` \| `all` |
| `action` | Exact action code (e.g. `auth.login`) |
| `search` | ilike on `summary` |
| `page` / `pageSize` | Default 25, max 100 |

UI: category + action dropdowns, search, Previous/Next.

## Security

1. **RLS deny-all** on `admin_activity_logs` — browsers/mobile cannot read or write via Supabase anon/authenticated keys.
2. **Writes only via API service role** (`getSupabaseAdmin()`), never from the client DB client.
3. **Client event endpoint** `POST /activity/events` requires a valid JWT and only accepts `auth.login` / `auth.logout` for the **authenticated user** (cannot impersonate another actor).
4. **Admin read/export** requires `requireAuth` + `requireAdmin`. Nav gated by `settings:manage`; export button by `reports:export`.
5. **Secrets stripped** from metadata (`password`, tokens, `razorpay_signature`, etc.).
6. **Best-effort writes** — logging failure does not fail payment/login/profile flows.
7. **PII** — emails appear in `actor_email` / summaries; treat exports as sensitive; restrict admin accounts.

## API

### Record auth event (student/admin app)

`POST /activity/events`  
Body: `{ "action": "auth.login" | "auth.logout", "metadata"?: {} }`

### List (admin)

`GET /admin/activity-logs?category=auth&page=1&pageSize=25`

### Export CSV (admin)

`GET /admin/activity-logs/export?category=payment`

## Files

| Path | Role |
|------|------|
| `apps/api/src/services/activityLog.service.ts` | Core write/list/export |
| `apps/api/src/routes/activityLog.routes.ts` | Client events |
| `apps/admin/src/pages/ActivityLogsPage.tsx` | Filters + pagination |
| `docs/api/activity-log.md` | This doc |
