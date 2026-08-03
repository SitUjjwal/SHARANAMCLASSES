# Admin Analytics Dashboard

Recharts analytics at `/analytics` powered by `GET /admin/analytics/overview`.

## Architecture

```
AnalyticsPage (React + Recharts)
  ├── DashboardCard KPIs
  ├── StudentGrowthChart / RevenueGrowthChart (Area)
  ├── RankingBarChart ×4 (horizontal bars)
  └── AverageTestScoresChart (Line)
        │
        ▼
analyticsService.fetchAnalyticsOverview()
        │
        ▼
GET /admin/analytics/overview
  adminInsights.routes → controller → analyticsOverview.service
        │
        ▼
Supabase aggregates
  profiles / enrollments / payment_orders
  video_watch_progress / pdf_download_events
  live_class_attendance / test_attempts
```

**Layers**
| Layer | Responsibility |
|-------|----------------|
| UI charts | Present series only — no business rules |
| `analyticsService` | Auth’d HTTP client |
| `analyticsOverview.service` | Parallel aggregates + ranking |
| Shared types | `AdminAnalyticsOverview` contract |

Test-series deep dive remains at `GET /admin/analytics` (subjects / recent activity).

## Charts

| Chart | Data source |
|-------|-------------|
| Student Growth | New `profiles` (student) per month ×6 |
| Revenue Growth | Paid `payment_orders` last 14 days (₹) |
| Course Popularity | Enrollment counts per course (top 8) |
| Most Viewed Videos | `video_watch_progress` rows per video |
| Most Downloaded PDFs | `pdf_download_events` counts |
| Live Class Attendance | `live_class_attendance` joins |
| Average Test Scores | Daily avg `%` from `test_attempts` |

## Migration

Apply `infra/supabase/migrations/20260803040000_analytics_events.sql`:

- `pdf_download_events`
- `live_class_attendance`

Until events are logged from mobile/API, PDF and attendance charts may be empty.

## API

`GET /admin/analytics/overview` → `AdminAnalyticsOverview`

Requires admin auth. Revenue KPI/chart gated in UI by `payments:view`.

## Files

| Path | Role |
|------|------|
| `apps/api/src/services/analyticsOverview.service.ts` | Aggregations |
| `apps/admin/src/pages/AnalyticsPage.tsx` | Page |
| `apps/admin/src/components/AnalyticsCharts.tsx` | Recharts |
| `packages/shared/src/types/adminAnalytics.ts` | Types |
