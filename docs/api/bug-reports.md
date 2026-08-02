# Bug Reports

Students report app bugs with a **description**, **screen selection**, and optional **screenshot**. Admins update status through investigation.

## Architecture

```
Mobile BugReportScreen
  description + screen_key + optional screenshot (multipart)
        │
        ▼
POST /bug-reports
  ├─ multer field `screenshot` (optional, JPEG/PNG/WebP ≤5MB)
  ├─ upload → Cloudflare R2  bug-screenshots/{userId}/…
  └─ insert bug_reports  status=open  ticket=BUGYYYY#####
        │
        ├─ Student tracks  GET /bug-reports · GET /bug-reports/:id
        └─ Admin inbox     GET/PATCH /admin/bug-reports
```

Separate from **Student Feedback** tickets (`student-feedback.md`) and **course reviews**.

## Status machine

```
open → in_progress → resolved → closed
                  ↘          ↗
                   (reopen → open)
```

## Student APIs

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/bug-reports` | Required | **multipart/form-data** |
| `GET` | `/bug-reports` | Required | My reports |
| `GET` | `/bug-reports/:reportId` | Required | One report |

### `POST /bug-reports` fields

| Field | Required | Notes |
|-------|----------|-------|
| `description` | Yes | 10–4000 chars |
| `screen_key` | Yes | See screen keys below |
| `screenshot` | No | Image file JPEG/PNG/WebP, max 5MB |

### Screen keys

`home` · `courses` · `course_detail` · `my_learning` · `chapters` · `video_player` · `pdf_viewer` · `tests` · `live` · `profile` · `settings` · `payments` · `notifications` · `other`

### Example response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticket_number": "BUG202600001",
    "description": "Video freezes after seek",
    "screen_key": "video_player",
    "screen_label": "Video player",
    "screenshot_url": "https://…/bug-screenshots/…",
    "status": "open",
    "admin_note": null,
    "created_at": "…",
    "updated_at": "…"
  },
  "message": "Bug report submitted"
}
```

## Admin APIs

| Method | Path | Body |
|--------|------|------|
| `GET` | `/admin/bug-reports?status=` | Filter `open` \| `in_progress` \| `resolved` \| `closed` |
| `PATCH` | `/admin/bug-reports/:reportId` | `{ "status": "in_progress", "admin_note": "optional" }` |

Admin UI: **Bug Reports** (`/bug-reports`) — thumbnail screenshot, status actions, **search** (ticket / student / screen / description).

## Migration

`infra/supabase/migrations/20260802240000_bug_reports.sql`

Requires R2 in production for screenshots (dev may fall back to Supabase `course-thumbnails` bucket).

## Mobile

- Feedback hub → **Report a bug** / **My bug reports**
- Stack: `BugReport`, `MyBugReports`, `BugReportDetail`
