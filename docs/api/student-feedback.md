# Student Feedback

Ticket-based feedback from students. Separate from **course star reviews** (`course-reviews.md`).

## Architecture

```
Mobile  SubmitFeedbackScreen
   │  type + title + message (+ course / teacher)
   ▼
POST /feedback
   │
   ▼
student_feedback  (status = open, ticket_number = FBYYYY#####)
   │
   ├─ Student tracks  GET /feedback  ·  GET /feedback/:id
   │
   └─ Admin inbox    GET /admin/feedback
                      PATCH /admin/feedback/:id  → in_progress / resolved / closed
```

### Layers

| Layer | Responsibility |
|-------|----------------|
| Migration | `student_feedback` table + ticket sequence RPC + RLS deny-all |
| Shared types | `FeedbackType`, `FeedbackTicketStatus`, `FeedbackTicket` |
| API service | Create, list mine, get one, admin list/update, teacher picker |
| Admin UI | `/feedback` — filter by status/type, Start / Resolve / Close / Reopen |
| Mobile | Submit form, My feedback list, Detail status timeline |

### Feedback types

| Type | Extra fields |
|------|----------------|
| `general` | — |
| `course` | `course_id` required (from My Courses) |
| `teacher` | `teacher_id` or free-text `teacher_name` |
| `suggestion` | — |
| `complaint` | — |

### Status machine

```
open → in_progress → resolved → closed
                  ↘          ↗
                   (reopen → open)
```

Students see a timeline on the detail screen. Admins may attach an `admin_note` when resolving/closing — mobile shows this as **Admin reply**.

## Student APIs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/feedback` | Create ticket |
| `GET` | `/feedback` | My tickets (newest first) |
| `GET` | `/feedback/teachers` | Teacher picker options |
| `GET` | `/feedback/:feedbackId` | One of my tickets |
| `PATCH` | `/feedback/:feedbackId` | Edit title/message — **open only** |
| `DELETE` | `/feedback/:feedbackId` | Delete — **open only** |

### `POST /feedback` body

```json
{
  "feedback_type": "course",
  "title": "Pace of Chapter 3",
  "message": "Could we get more practice questions…",
  "course_id": "uuid"
}
```

Teacher example:

```json
{
  "feedback_type": "teacher",
  "title": "Clear explanations",
  "message": "Sir explains numericals very well.",
  "teacher_id": "uuid"
}
```

Response includes `ticket_number` (e.g. `FB202600001`) and `status: "open"`.

## Admin APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/feedback?status=&feedback_type=` | Inbox |
| `PATCH` | `/admin/feedback/:feedbackId` | `{ status, admin_note? }` |
| `DELETE` | `/admin/feedback/:feedbackId` | Permanently remove ticket |

Admin UI: **Feedback** (`/feedback`) — Start / Resolve / Close / Reopen / **Delete**.

### Student edit/delete rules

| Status | Student edit | Student delete |
|--------|--------------|----------------|
| `open` | Yes (title + message) | Yes |
| `in_progress` / `resolved` / `closed` | No | No |

Errors: `FEEDBACK_NOT_EDITABLE` · `FEEDBACK_NOT_DELETABLE` (400).

## Migration

`infra/supabase/migrations/20260802230000_student_feedback.sql`

## Mobile entry

Profile / Settings / Drawer → **Feedback & Support** → **Submit feedback** / **My feedback**

Bug report / Feature request shortcuts preselect `complaint` / `suggestion`.
