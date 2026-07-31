# Live Classes API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

**Storage rule:** PostgreSQL stores YouTube Live **URL** + schedule + thumbnail URL. Never video binaries.

---

## Data model (`live_classes`)

| Column | Purpose |
|--------|---------|
| `youtube_url` / `youtube_video_id` | Live stream link |
| `start_time` / `end_time` | Schedule (`end_time > start_time`) |
| `thumbnail_url` | Upload or YouTube default |
| `course_id` | Optional course link |
| `is_published` | Visible to students when true |
| `notification_sent_at` | Set when admin sends notification |

Derived **status**: `upcoming` \| `live` \| `ended` (from now vs start/end).

---

## Admin APIs

### `GET /live-classes`

| Query | Values |
|-------|--------|
| `courseId` | uuid |
| `search` | string |
| `status` | `all` \| `upcoming` \| `live` \| `ended` |
| `publishStatus` | `all` \| `published` \| `draft` |
| `page` / `pageSize` | pagination |

Response: `{ items, page, pageSize, total, hasMore }` (includes `course_title`, `status`).

---

### `POST /live-classes`

```json
{
  "course_id": "uuid-or-null",
  "title": "Maths Live Doubt Session",
  "description": "",
  "youtube_url": "https://www.youtube.com/live/XXXXXXXXXXX",
  "thumbnail_url": null,
  "start_time": "2026-08-01T14:00:00.000Z",
  "end_time": "2026-08-01T15:00:00.000Z",
  "is_published": true
}
```

Validates YouTube URL + `end_time > start_time`. Empty thumbnail → YouTube `hqdefault`.

---

### `GET /live-classes/:id` · `PUT /live-classes/:id` · `DELETE /live-classes/:id`

Standard admin read / partial update / delete.

---

### `POST /live-classes/upload-thumbnail`

Multipart field `thumbnail` (image). Reuses `course-thumbnails` bucket.  
Response: `{ url }`.

---

### `POST /live-classes/:id/notify`

Sends an **in-app notification** (production path today):

1. Inserts a row into `app_updates` (shows on student Home → Latest updates)
2. Sets `live_classes.notification_sent_at = now()`

Optional body:

```json
{ "title": "…", "body": "…" }
```

Requires the live class to be **published**.  
Push/FCM is not wired yet (`fcmClient` stub); this endpoint is the supported notify path.

---

## Student API

### `GET /live-classes`

Auth required. When the caller is **not** an admin, returns the published public list.  
Optional `?courseId=`. Includes `status`, `teacher_name`, and `youtube_url` (upcoming/live).

Admins on the same path get the paginated admin list (see above).

### `GET /live-classes/public`

Alias of the student list (kept for existing mobile clients).

---

## Migration

`infra/supabase/migrations/20260731180000_live_classes.sql`

## Student app

**Live** tab → `LiveClassesScreen`:
- **LIVE NOW** + teacher + start time + **Join Live** (opens YouTube)
- Upcoming → **Starts in** `HH:MM:SS` countdown
- Public payload includes `teacher_name` from linked course
