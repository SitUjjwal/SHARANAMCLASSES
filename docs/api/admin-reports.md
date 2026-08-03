# Admin Reports Module

Generate and export operational reports as **PDF**, **Excel**, or **CSV**.

## Architecture

```
ReportsPage
  ├── Report cards (6 types)
  └── Export buttons → CSV | Excel | PDF
        │
reportService.exportAdminReport(key, format)
        │
GET /admin/reports/:key/export?format=csv|xlsx|pdf
  adminOps.routes → controller → reportExport.service
        │
        ├── Domain row builders (students, payments, …)
        ├── CSV serializer
        ├── ExcelJS workbook
        └── pdf-lib table PDF
        │
        ▼
{ filename, base64, mime, row_count }
```

| Layer | Responsibility |
|-------|----------------|
| UI | Catalog + format picker + download |
| `reportExport.service` | Query data + serialize formats |
| Shared types | `AdminReportSummary`, `AdminReportFileExport` |
| Permission | `reports:export` (UI); API `requireAdmin` |

## Reports

| Key | Content |
|-----|---------|
| `students` | Profiles (student) + enrollment counts + status |
| `payments` | Payment orders + student email + course |
| `revenue` | Paid revenue aggregated by day |
| `courses` | Courses + teacher + enrollments |
| `attendance` | `live_class_attendance` joins (empty until events exist) |
| `teachers` | Instructors + course / live counts |

## API

### Catalog

`GET /admin/reports` → `AdminReportSummary[]`  
Each item includes `formats: ['csv','xlsx','pdf']`.

### Export

`GET /admin/reports/:reportKey/export?format=csv|xlsx|pdf`

Response:

```json
{
  "success": true,
  "data": {
    "key": "students",
    "title": "Student Report",
    "format": "xlsx",
    "filename": "students-report-2026-08-03.xlsx",
    "base64": "…",
    "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "row_count": 42
  }
}
```

Row caps: typically up to ~2000 (PDF truncates display to 500).

## Admin UI

`/reports` — card per report with **Open** + **CSV / Excel / PDF**.

## Files

| Path | Role |
|------|------|
| `apps/api/src/services/reportExport.service.ts` | Generators + exporters |
| `apps/admin/src/pages/ReportsPage.tsx` | UI |
| `apps/admin/src/services/reportService.ts` | Client |
| `packages/shared/src/types/adminOps.ts` | Types |
| `docs/api/admin-reports.md` | This doc |
