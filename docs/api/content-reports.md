# Content Reports

Students report **content quality** issues (wrong video/PDF, broken link, bad question, duplicate). Admins triage and update status from the dashboard.

## Architecture

```
Mobile ReportContentScreen
  report_type + description + optional target context
        │
        ▼
POST /content-reports
  └─ insert content_reports  status=open  ticket=CRYYYY#####
        │
        ├─ Student tracks  GET /content-reports · GET /content-reports/:id
        └─ Admin inbox     GET/PATCH /admin/content-reports
```

Separate from **Bug Reports** (app defects) and **Student Feedback** tickets.

## Report types

| Key | Label |
|-----|-------|
| `incorrect_video` | Incorrect Video |
| `wrong_pdf` | Wrong PDF |
| `broken_link` | Broken Link |
| `incorrect_question` | Incorrect Question |
| `duplicate_content` | Duplicate Content |

Optional **target** fields help admins locate the asset:

`target_type` · `target_id` · `course_id` · `chapter_id` · `target_label`

`target_type`: `video` | `pdf` | `note` | `question` | `chapter` | `course` | `other`

## Status machine

```
open → in_progress → resolved → closed
                  ↘          ↗
                   (reopen → open)
```

## Student APIs

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/content-reports` | Required | JSON (see below) |
| `GET` | `/content-reports` | Required | My reports (newest first) |
| `GET` | `/content-reports/:reportId` | Required | One report (own only) |

### `POST /content-reports` body

| Field | Required | Notes |
|-------|----------|-------|
| `report_type` | Yes | One of the five keys above |
| `description` | Yes | 10–4000 chars |
| `target_type` | No | Asset kind |
| `target_id` | No | UUID of video/pdf/question/etc. |
| `course_id` | No | UUID |
| `chapter_id` | No | UUID |
| `target_label` | No | Human title for admin UI |

### Example request

```json
{
  "report_type": "incorrect_video",
  "description": "This lecture is for Class 10 but listed under Class 12 Physics.",
  "target_type": "video",
  "target_id": "uuid",
  "course_id": "uuid",
  "chapter_id": "uuid",
  "target_label": "Newton’s Laws — Part 2"
}
```

### Example response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticket_number": "CR202600001",
    "report_type": "incorrect_video",
    "description": "…",
    "target_type": "video",
    "target_id": "uuid",
    "course_id": "uuid",
    "chapter_id": "uuid",
    "target_label": "Newton’s Laws — Part 2",
    "status": "open",
    "admin_note": null,
    "resolved_at": null,
    "closed_at": null,
    "created_at": "…",
    "updated_at": "…"
  },
  "message": "Content report submitted"
}
```

## Admin APIs

| Method | Path | Body / query |
|--------|------|----------------|
| `GET` | `/admin/content-reports?status=&report_type=` | Optional filters |
| `PATCH` | `/admin/content-reports/:reportId` | `{ "status": "in_progress", "admin_note": "optional" }` |

Admin list rows include `student_name`, `student_email`, and `course_title`.

Admin UI: **Content Reports** (`/content-reports`) — filter by status/type; Start / Resolve / Close / Reopen.

## Mobile entry points

| Screen | Prefill |
|--------|---------|
| Feedback → Report content | none |
| Video player → Report content | `incorrect_video` + video target |
| PDF viewer → Report wrong PDF | `wrong_pdf` + pdf target |
| Test review → Report incorrect question | `incorrect_question` + question target |

## Migration

Apply `infra/supabase/migrations/20260802270000_content_reports.sql` on Supabase, then restart the API.
