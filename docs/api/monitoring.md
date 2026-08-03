# Module 11 — Monitoring

Live ops metrics for the SHARANAM CLASSES API process, surfaced in the admin **Monitoring** dashboard.

## What is tracked

| Metric | How |
| --- | --- |
| **API response time** | `requestLogger` records `duration_ms` on every response (p50 / p95 / p99, per-route) |
| **Database response time** | 15s probe (`app_meta` SELECT) + `withDbTiming()` on `/database-status` |
| **Memory usage** | `process.memoryUsage()` sampled every 15s (RSS, heap) |
| **CPU usage** | Process CPU % from `process.cpuUsage()` deltas + OS load average (Unix) |
| **Failed requests** | HTTP status ≥ 400 counted in the rolling window |
| **Failed payments** | `paymentOrderRepository.markFailed()` increments counter |
| **Notification failures** | `sendNotification` push failure count increments counter |

## Architecture

```
requestLogger ──► metricsStore (in-memory, 60 min window)
DB probe / withDbTiming ──► metricsStore
markFailed / push failures ──► metricsStore
systemSampler (15s) ──► memory + CPU + DB probe
                 └──► optional snapshot → system_metrics_snapshots

GET /admin/monitoring/overview  (settings:read)
         ▲
Admin → Operations → Monitoring  (auto-refresh 15s)
```

**Process-local:** each API instance reports its own metrics. For multi-instance deploys, view each process or add an aggregator later.

## Key files

| Path | Role |
| --- | --- |
| `apps/api/src/monitoring/metricsStore.ts` | Rolling ring buffers + overview builder |
| `apps/api/src/monitoring/systemSampler.ts` | Interval probes + optional DB snapshots |
| `apps/api/src/monitoring/timeDb.ts` | Helper to time DB work |
| `apps/api/src/logging/requestLogger.ts` | Feeds API latency + failed requests |
| `apps/api/src/routes/monitoring.routes.ts` | `GET /admin/monitoring/overview` |
| `apps/admin/src/pages/MonitoringPage.tsx` | Dashboard UI |
| `packages/shared/src/types/adminMonitoring.ts` | Shared `MonitoringOverview` type |
| `infra/supabase/migrations/20260804010000_system_metrics_snapshots.sql` | Optional history table |

## Setup

1. Apply migration (optional but recommended for historical snapshots):

`infra/supabase/migrations/20260804010000_system_metrics_snapshots.sql`

2. Restart API (`apps/api`) so `startMonitoringSampler()` runs.

3. Open Admin → **Operations → Monitoring** (requires `settings:read`).

## API

```http
GET /admin/monitoring/overview
Authorization: Bearer <staff JWT>
```

Returns `{ success: true, data: MonitoringOverview }`.

## Extending

- Wrap more hot queries with `withDbTiming('label', () => …)`.
- Call `metricsStore.recordFailedPayment()` / `recordNotificationFailures(n)` from new failure paths.
- Snapshots insert every 5 minutes; ignore errors if the migration is not applied yet.
- Alerts: `alertStore` evaluates thresholds every 15s (and on `/metrics` / overview). See `GET /alerts`.
