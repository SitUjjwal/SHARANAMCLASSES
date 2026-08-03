# Module 10 — Admin Operations Dashboard

Production admin ops for SHARANAM CLASSES (`apps/admin` + `apps/api`).

## Scope

| Area | Status |
|------|--------|
| Dashboard KPIs + Recharts | Done |
| Dark / light theme | Done |
| Role-based UI permissions | Done |
| Revenue page | Done |
| Reports page | Done |
| Activity Logs | Done |
| Settings | Done |
| Students / Teachers / Courses / Analytics / Payments | Existing pages reused |

## Folder structure

```
apps/admin/src/
  pages/          Dashboard, Revenue, Reports, ActivityLogs, Settings, …
  components/     DashboardCard, RevenueChart, StudentChart, CourseChart,
                  DataTable, ExportButton, FilterBar
  services/       analyticsService, reportService, teacherService, settingService
  theme/          ThemeProvider (light/dark)
  features/auth/  permissions.ts + AuthProvider role
```

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/dashboard/overview` | Home KPIs + chart series |
| GET | `/admin/revenue/overview` | Revenue KPIs + 14-day series |
| GET | `/admin/reports` | Report catalog |
| GET | `/admin/activity-logs` | Paginated audit log |
| GET | `/admin/activity-logs/export` | CSV export |
| GET | `/admin/settings` | Platform settings |
| PUT | `/admin/settings` | Update settings (+ activity log) |

## Migration

Apply `infra/supabase/migrations/20260803010000_admin_activity_settings.sql`:

- `admin_activity_logs`
- `platform_settings`

Until applied, activity logs return empty; settings fall back to defaults on read (write needs the table).

## Roles (UI)

| Role | Notes |
|------|--------|
| `admin` | Full access |
| `instructor` | Dashboard (no payment KPIs), courses, analytics, feedback |
| `viewer` | Dashboard + analytics + payments view |

API mutations still use `requireAdmin`.

## Run

1. Apply migration in Supabase SQL editor
2. `npm run build --workspace=@sharanam/shared`
3. Restart API + admin (`npm run dev --workspace=@sharanam/api` / `@sharanam/admin`)
4. Open http://localhost:5173/
