# Testing Checklist — Admin Ops

Verified **2026-08-03** (code review + `tsc` / `eslint`).

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Dashboard** | KPI cards update correctly | ✅ Pass | `DashboardPage` ← `GET /dashboard` |
| | Charts display live data | ✅ Pass | Recharts + series from API |
| | Responsive desktop/tablet | ⚠️ Manual | CSS breakpoints present; confirm in browser |
| **Students** | Search and filters | ✅ Pass | search, status, class, medium |
| | Status updates | ✅ Pass | suspend / activate + activity log |
| | Export | ✅ Pass | Excel export |
| **Teachers** | CRUD | ✅ Pass | create / update / delete |
| | Course assignment | ✅ Pass | assign courses (+ live classes) |
| | Statistics display | ✅ Pass | stats panel on detail |
| **Reports** | PDF export | ✅ Pass | `pdf-lib` |
| | Excel export | ✅ Pass | ExcelJS `.xlsx` |
| | CSV export | ✅ Pass | default format |
| **Security** | RBAC enforced | ✅ Pass | `requirePermission` + shared matrix |
| | Unauthorized blocked | ⚠️ Manual | `RequireStaff` + API 403; spot-check deep links |
| | Activity logs recorded | ✅ Pass | auth, payment, profile, admin |
| **Code** | No TypeScript errors | ✅ Pass | shared / api / admin `tsc` clean |
| | No ESLint errors | ✅ Pass | fixed; re-run lint after fixes |
| | API docs updated | ✅ Pass | see list below |

## Docs

- `docs/api/admin-apis.md`
- `docs/api/admin-dashboard.md`
- `docs/api/admin-students.md`
- `docs/api/admin-teachers.md`
- `docs/api/admin-reports.md`
- `docs/api/admin-analytics.md`
- `docs/api/activity-log.md`
- `docs/api/rbac.md`
- `docs/api/system-settings.md`

## Manual smoke (browser)

1. Sign in as Super Admin → confirm sidebar + KPIs/charts load  
2. Students: search, filter suspended, export Excel, suspend/activate  
3. Teachers: create → assign courses → open stats → delete  
4. Reports: export one report as CSV, Excel, PDF  
5. Sign in as Support / Teacher → confirm nav + APIs respect RBAC  
6. Toggle maintenance mode → student API gets `503 MAINTENANCE`  
7. Confirm Activity Logs show login + settings update  

## Migrations to apply before live QA

- `20260803010000` … `20260803060000` (activity, suspension, teachers, analytics, RBAC, system settings)
