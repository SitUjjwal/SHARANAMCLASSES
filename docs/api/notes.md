# Notes API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

**Storage rule:** PostgreSQL stores **only** the notes HTTPS URL. No note file binaries.

---

## Admin

### `GET /notes`

| Query | Values | Notes |
|-------|--------|--------|
| `courseId` / `chapterId` | uuid | Filters |
| `search` | string | Title / description / URL |
| `access` | `free` \| `paid` \| `all` | Default `all` |
| `status` | `published` \| `draft` \| `all` | Default `all` |
| `page` / `pageSize` | number | Default `1` / `20` |

---

### `POST /notes`

```json
{
  "course_id": "uuid",
  "chapter_id": "uuid",
  "title": "Class Notes — Real Numbers",
  "description": "",
  "notes_url": "https://docs.google.com/document/d/…",
  "sort_order": 0,
  "is_free": false,
  "is_published": true
}
```

| Validation | Rule |
|------------|------|
| `notes_url` | **HTTPS only**; no credentials; blocks localhost / private IPs |
| Chapter | Must belong to course |

---

### `PUT /notes/:id` / `DELETE /notes/:id`

Partial update / delete. Syncs chapter `notes_count`.

---

## Student (via chapter detail)

`GET /courses/:courseId/chapters/:chapterId` includes:

- `notes: NotePublic[]` — `notes_url` is `null` when paid + not enrolled
- Mirrored into `contents[]` as `content_type: 'note'`

Mobile opens notes in an in-app WebView that only allows `https:` navigations.

Migration: `infra/supabase/migrations/20260731170000_notes.sql`
