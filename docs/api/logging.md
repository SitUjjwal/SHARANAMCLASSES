# Application Logging System

Structured JSON logging for `@sharanam/api` with file storage and rotation.

## Architecture

```
Request / Domain event
        │
        ▼
┌───────────────────────────┐
│ logger.info/warn/error    │  categories: error · warning · payment · auth · admin · api · system
│  (+ requestLogger MW)     │
└─────────────┬─────────────┘
              │ redact secrets
              ▼
┌───────────────────────────┐
│ rotating-file-stream      │  daily + size rotation, maxFiles retention
└─────────────┬─────────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
 app.log   error.log  access.log
 (all)     (errors)   (API requests)

Also: admin_activity_logs (Supabase) for audit UI — mirrored from writeActivityLog
```

## Categories

| Category | Sources |
|----------|---------|
| **error** | Unhandled exceptions, 5xx AppErrors, payment verify hard failures |
| **warning** | 4xx AppErrors, validation, CORS, rate limit, soft payment fails |
| **payment** | Order created, verify success (via activity), verify failures |
| **auth** | Missing/invalid JWT, suspended accounts, login/logout activity |
| **admin** | `writeActivityLog` admin actions (students, teachers, settings, roles) |
| **api** | Every HTTP request (except `/health`) — method, path, status, duration, request_id |
| **system** | Boot, scheduler, misc |

## Files (under `LOG_DIR`, default `logs/`)

| File pattern | Contents |
|--------------|----------|
| `app.log` → rotated `app-YYYY-MM-DD[.N].log` | All levels |
| `error.log` → `error-YYYY-MM-DD[.N].log` | Errors only |
| `access.log` → `access-YYYY-MM-DD[.N].log` | API request lines |

Rotation: **daily** (`interval: 1d`) **and** when size exceeds `LOG_MAX_SIZE` (default `20M`). Keeps up to `LOG_MAX_FILES` (default `14`).

`logs/` is gitignored.

## Env

```
LOG_LEVEL=info          # debug | info | warn | error
LOG_DIR=logs
LOG_MAX_FILES=14
LOG_MAX_SIZE=20M
LOG_TO_CONSOLE=true     # optional; defaults on in non-production
```

## Entry points

| Module | Role |
|--------|------|
| `logging/logger.ts` | Core emit + streams |
| `logging/requestLogger.ts` | Express middleware for API requests |
| `middlewares/errorHandler.ts` | Errors / warnings |
| `middlewares/auth.ts` | Auth failures |
| `services/activityLog.service.ts` | Mirrors audit rows → file logger |
| `services/payment.service.ts` | Payment create / verify failure |

## Example line

```json
{
  "ts": "2026-08-03T15:45:00.123Z",
  "level": "info",
  "category": "api",
  "message": "GET /courses 200",
  "method": "GET",
  "path": "/courses",
  "status": 200,
  "duration_ms": 42,
  "request_id": "…",
  "user_id": "…",
  "env": "development"
}
```

## Dual store

1. **Files** — ops / debugging / SIEM ship
2. **Supabase `admin_activity_logs`** — admin Activity Log UI (auth, payments, admin actions)

Secrets (`password`, `token`, `razorpay_signature`, …) are redacted before write.
