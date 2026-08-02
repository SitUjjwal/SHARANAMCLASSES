# Admin Feedback Dashboard

Unified admin inbox across **course reviews**, **bug reports**, **support tickets**, **feature requests**, and **support chat**, with analytics KPIs, search, filters, pagination, and CSV export.

Dedicated workflow pages (approve review, reply to chat, resolve bug) remain separate — this dashboard is the **operations overview + jump-off point**.

## Architecture

```
Admin FeedbackDashboardPage
        │
        ├─ GET /admin/feedback-dashboard/stats     → KPI strip
        ├─ GET /admin/feedback-dashboard           → searchable paginated inbox
        └─ GET /admin/feedback-dashboard/export    → CSV (≤1000 rows)

API feedbackDashboard.service
        │
        ├─ course_reviews          → Pending / Approved Reviews
        ├─ student_feedback
        │     type ≠ suggestion    → Support Tickets
        │     type = suggestion    → Feature Requests
        ├─ bug_reports             → Bug Reports
        └─ support_conversations   → Support Chat
```

| Concern | Ownership |
|---------|-----------|
| Aggregate counts & inbox | `feedbackDashboard.service.ts` |
| Moderation / status changes | Existing pages + APIs (`/reviews`, `/feedback`, `/bug-reports`, `/support-chat`) |
| Shared DTOs | `@sharanam/shared` → `feedbackDashboard.ts` |

**Feature requests are not a separate table** — they are `student_feedback` rows with `feedback_type = 'suggestion'`.

## Analytics (stats)

| Field | Meaning |
|-------|---------|
| `pending_reviews` | `course_reviews.status = pending_approval` |
| `approved_reviews` | Approved reviews |
| `rejected_reviews` | Rejected reviews |
| `bug_reports_open` / `_total` | Bug report queue |
| `support_tickets_open` / `_total` | Feedback tickets excluding suggestions |
| `feature_requests_open` / `_total` | Suggestions |
| `support_chats_open` | Open chat threads |
| `support_chats_unread` | Open chats where student activity is newer than admin last-read |
| `content_reports_open` | Open content quality reports (linked from UI) |
| `submitted_last_7_days` | New reviews + tickets + bugs + chats |
| `resolved_last_7_days` | Tickets/bugs moved to resolved/closed in 7d |

## Inbox APIs

### `GET /admin/feedback-dashboard/stats`

Auth: admin. Returns `FeedbackDashboardStats`.

### `GET /admin/feedback-dashboard`

| Query | Values |
|-------|--------|
| `category` | `all` \| `pending_reviews` \| `approved_reviews` \| `bug_reports` \| `support_tickets` \| `feature_requests` \| `support_chat` |
| `status` | Source-specific (`pending_approval`, `open`, `in_progress`, …) or `all` |
| `search` | Matches ref, title, detail, student name/email, status |
| `page` | Default `1` |
| `pageSize` | Default `20`, max `100` |

Response: `{ items, page, pageSize, total, hasMore }` where each item has `source`, `category`, `ref`, `title`, `detail`, `status`, student fields, timestamps, and `admin_path` for deep-link.

### `GET /admin/feedback-dashboard/export`

Same filters as list (no pagination). Returns `{ filename, csv }`. Cap: 1000 rows.

## Admin UI

Route: **`/feedback-dashboard`** (nav: Feedback Dashboard)

- KPI analytics strip  
- Category tabs with open-count badges  
- Debounced search + status filter + Refresh + Export CSV  
- Paginated table with **Open** → dedicated page  

## Production notes

- Counts use Supabase `count: 'exact'` head queries.  
- Inbox merges recent rows per source (≤300 each), then filters/sorts/paginates in the API — consistent with existing admin list limits. Scale later with SQL `UNION ALL` + DB indexes if volume grows.  
- Restart API after deploy; rebuild `@sharanam/shared`.  
- No new migration (reads existing tables).
