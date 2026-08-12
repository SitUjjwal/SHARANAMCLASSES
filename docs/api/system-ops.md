# System Ops API

Short production paths for health, metrics, logs, backup, and restore.

## Endpoints

| Method | Path | Auth | Permission | Notes |
|--------|------|------|------------|--------|
| `GET` | `/health` | Public | — | Liveness: process up (`app_env`, `uptime_s`) |
| `GET` | `/ready` | Public | — | Readiness: DB OK + not shutting down (503 otherwise) |
| `GET` | `/metrics` | Staff JWT | `settings:read` | Same data as `/admin/monitoring/overview` (+ alerts) |
| `GET` | `/alerts` | Staff JWT | `settings:read` | Threshold alerts list |
| `POST` | `/alerts/:id/ack` | Staff JWT | `settings:update` | Acknowledge alert |
| `GET` | `/logs` | Staff JWT | `settings:read` | Activity logs (default) or file tail |
| `POST` | `/backup` | Staff JWT | `settings:update` | Manual backup run |
| `POST` | `/restore` | Staff JWT | `settings:update` | Restore from a run id |
| `GET` | `/system-status` | Staff JWT | `settings:read` | API + DB + process snapshot |

Admin UI still uses the longer `/admin/...` routes; these are aliases for ops / scripts / monitors.

---

### `GET /health`

```http
GET /health
```

```json
{
  "status": "ok",
  "app_env": "production",
  "node_env": "production",
  "uptime_s": 120
}
```

Used by Docker `HEALTHCHECK` (liveness). Does **not** check the database.

---

### `GET /ready`

```http
GET /ready
```

```json
{
  "status": "ready",
  "app_env": "production",
  "node_env": "production",
  "checks": { "database": "ok" }
}
```

Returns **503** when Supabase/DB is unreachable or the process is shutting down. Point load-balancer **readiness** probes here.

---

### `GET /metrics`

```http
GET /metrics
Authorization: Bearer <staff JWT>
```

Returns `MonitoringOverview` (latency, memory, CPU, failed requests/payments/notifications).

---

### `GET /logs`

**Activity logs (default):**

```http
GET /logs?page=1&pageSize=25&category=all
Authorization: Bearer <staff JWT>
```

**File tail (today’s rotating logs):**

```http
GET /logs?source=file&kind=error&lines=100
Authorization: Bearer <staff JWT>
```

`kind`: `app` | `error` | `access`

---

### `POST /backup`

```http
POST /backup
Authorization: Bearer <staff JWT>
```

Triggers a manual backup (same as `POST /admin/backups/run`).

---

### `POST /restore`

```http
POST /restore
Authorization: Bearer <staff JWT>
Content-Type: application/json

{
  "runId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "mode": "settings"
}
```

`mode`: `settings` | `settings_and_r2_metadata` (default `settings`).

Same engine as `POST /admin/backups/:runId/restore`.

---

### `GET /system-status`

```http
GET /system-status
Authorization: Bearer <staff JWT>
```

Aggregates:

- API uptime / env
- Database connectivity
- Process memory
- Short metrics window (failures + p95)

Returns **503** if the database check fails.

---

## Related

- Longer admin routes: `/admin/monitoring/overview`, `/admin/backups/*`, `/activity-logs`
- Docs: [monitoring.md](./monitoring.md), [backup-system.md](./backup-system.md)
