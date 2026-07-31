# Videos API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

**Storage rule:** PostgreSQL stores **only** the YouTube URL (+ extracted video id). Never upload video binaries.

---

## Admin

### `GET /videos`

List videos (paginated).

| Query | Values | Notes |
|-------|--------|--------|
| `courseId` | uuid | Filter by course |
| `chapterId` | uuid | Filter by chapter |
| `search` | string | Title / description / YouTube id |
| `videoType` | `recorded` \| `live` \| `all` | Default `all` |
| `access` | `free` \| `paid` \| `all` | Default `all` |
| `status` | `published` \| `draft` \| `all` | Default `all` |
| `page` | number | Default `1` |
| `pageSize` | number | 1–100, default `20` |

Response `data`: `{ items, page, pageSize, total, hasMore }`  
Each item includes `course_title`, `chapter_title` for admin UI.

---

### `GET /videos/:id`

Single video (admin). Validates course/chapter still exist.

---

### `POST /videos`

Create video.

```json
{
  "course_id": "uuid",
  "chapter_id": "uuid",
  "title": "Real Numbers — Intro",
  "description": "",
  "youtube_url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "video_type": "recorded",
  "thumbnail_url": null,
  "duration_seconds": 900,
  "sort_order": 0,
  "is_free": false,
  "is_published": true
}
```

| Field | Rules |
|-------|--------|
| `course_id` / `chapter_id` | Required; chapter must belong to course |
| `youtube_url` | Valid YouTube watch / youtu.be / embed / live / shorts (unlisted OK) |
| `video_type` | `recorded` (default) or `live` |
| `thumbnail_url` | Optional; if omitted, YouTube `hqdefault` thumbnail is used |
| `is_free` | `true` = free preview without enroll |
| `sort_order` | `0` → auto append (`last + 10`) |

On success: extracts `youtube_video_id`, stores canonical URL, syncs chapter `video_count` / duration.

---

### `PUT /videos/:id`

Partial update — same fields as create (including re-assign `course_id` / `chapter_id`).  
Re-validates YouTube URL when `youtube_url` is sent.

---

### `DELETE /videos/:id`

Deletes the row and re-syncs chapter video counts.

---

### `POST /videos/upload-thumbnail`

Multipart field: `thumbnail` (JPEG/PNG/WebP/GIF, ≤5MB).  
Returns `{ url }` for `thumbnail_url` on create/update.

---

## Student (via chapter detail)

### `GET /courses/:courseId/chapters/:chapterId`

`data.videos[]` (and mirrored into `data.contents` as `content_type: "video"`):

| Field | Locked (paid + not enrolled) | Unlocked |
|-------|------------------------------|----------|
| `youtube_url` | `null` | full URL |
| `is_locked` | `true` | `false` |
| `is_free` | as stored | as stored |

Chapter-level lock still applies: if the chapter itself is locked, both `videos` and `contents` are empty.

---

## Migration

Run in Supabase SQL Editor:

`infra/supabase/migrations/20260731150000_videos.sql`
