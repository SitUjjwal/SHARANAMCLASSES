# Backup System

Logical backups for SHARANAM CLASSES: **settings**, **database table snapshots**, and **Cloudflare R2 metadata** — stored as gzip JSON archives in R2.

## Architecture

```
┌─────────────────┐     cron / manual      ┌──────────────────┐
│ Admin Backups UI│ ─────────────────────► │ backup.service   │
└─────────────────┘                        │  export tables   │
                                           │  + settings      │
┌─────────────────┐                        │  + R2 metadata   │
│ backup_jobs     │ ◄── schedule/policy ── │  gzip → R2       │
│ backup_runs     │ ◄── run history ────── └────────┬─────────┘
└─────────────────┘                                 │
                                                    ▼
                                         R2: backups/{ym}/{runId}/
                                             backup.json.gz
                                             manifest.json
```

### Why not `pg_dump`?
The API only has Supabase URL + service role (no `DATABASE_URL`). Backups use **paginated PostgREST exports** of critical tables into JSON. That is portable and works on managed Supabase without DB password access.

### What each feature means

| Feature | Implementation |
| --- | --- |
| **Database Backup** | Export catalog/ops tables (`courses`, `chapters`, `pdfs`, payments, …) as JSON |
| **R2 Metadata Backup** | Inventory of `storage_key` / `file_url` (pdfs, avatars, certificates, logo) — **not** full PDF binary dump |
| **Settings Backup** | All `platform_settings` rows (including `general`) |
| **Manual Backup** | `POST /admin/backups/run` (`settings:update`) |
| **Scheduled Backup** | `node-cron` via `BACKUP_ENGINE_CRON` (default `0 2 * * *` Asia/Kolkata) |
| **Restore Backup** | Safe modes only: **settings** or **settings + R2 metadata pointers** |

Full automatic re-insert of every table row is **intentionally not exposed** in the UI (FK order, auth.users mismatch, live payment risk). Use the downloaded archive for disaster recovery procedures offline if needed.

## Key files

| Path | Role |
| --- | --- |
| `infra/supabase/migrations/20260804020000_backup_system.sql` | `backup_jobs` + `backup_runs` |
| `apps/api/src/services/backup.service.ts` | Export / pack / upload / restore / prune |
| `apps/api/src/jobs/backupEngine/scheduler.ts` | Cron runner |
| `apps/api/src/routes/backup.routes.ts` | Admin HTTP API |
| `apps/admin/src/pages/BackupsPage.tsx` | Dashboard |
| `packages/shared/src/types/backup.ts` | Shared types |

## Setup

1. Run migration: `20260804020000_backup_system.sql`
2. Ensure R2 env vars are set (`R2_*`)
3. Optional API env:

```env
# BACKUP_ENGINE_ENABLED=false
BACKUP_ENGINE_CRON=0 2 * * *
BACKUP_ENGINE_TZ=Asia/Kolkata
BACKUP_RETAIN_DAYS=30
```

4. Restart API → Admin → **Operations → Backups**

## API

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/admin/backups/overview` | `settings:read` |
| POST | `/admin/backups/run` | `settings:update` |
| PATCH | `/admin/backups/job` | `settings:update` |
| POST | `/admin/backups/:runId/restore` | `settings:update` |

Restore body: `{ "mode": "settings" | "settings_and_r2_metadata" }`

## Archive format

`backup.json.gz` decompresses to:

```json
{
  "manifest": { "version": 1, "includes": { ... }, "row_counts": { ... } },
  "settings": [ { "key": "general", "value": { ... } } ],
  "database": { "courses": [ ... ], "pdfs": [ ... ] },
  "r2_metadata": [ { "source_table": "pdfs", "id": "...", "storage_key": "..." } ]
}
```

## Safety notes

- Restore **settings** is the primary safe path for branding / maintenance recovery.
- Restore **R2 metadata** rewrites URL/key columns; it does not re-upload binary objects.
- Binary R2 objects remain in the bucket unless separately deleted — metadata restore reconnects pointers.
- Prune deletes old run rows + R2 archive keys after `retain_days`.
