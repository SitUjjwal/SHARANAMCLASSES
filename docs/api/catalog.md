# Catalog API (Courses · Chapters · Categories)

Base URL: `http://localhost:4000` (local)  
Auth header on all routes: `Authorization: Bearer <supabase_access_token>`  
Admin mutations also require `profiles.role = 'admin'` (or email in `ADMIN_EMAILS`).

Response envelope: see [conventions.md](./conventions.md).

---

## Courses

### `GET /courses`

List courses (paginated).

| Query | Type | Notes |
|-------|------|--------|
| `search` | string | Title / slug / teacher |
| `categoryId` | uuid | Optional |
| `price` | `free` \| `paid` \| `all` | Default `all` |
| `status` | `all` \| `active` \| `inactive` | Admin only; default `all` |
| `featured` | `true` \| `false` | Student filters |
| `classLevel` | string | Optional |
| `medium` | `hindi` \| `english` | Optional |
| `page` | number | Default `1` |
| `pageSize` | number | 1–100, default `10` |

- **Admin** → full catalog (includes unpublished).
- **Student** → published only; items include `is_purchased`.

### `POST /courses` (admin)

Create course. Body (required: `title`, `slug`):

```json
{
  "title": "Class 10 Maths",
  "slug": "class-10-maths",
  "description": "",
  "category_id": null,
  "thumbnail_url": null,
  "class_level": "10",
  "medium": "hindi",
  "teacher_name": "Teacher Name",
  "price": 999,
  "is_free": false,
  "is_featured": false,
  "is_published": true,
  "sort_order": 0,
  "rating": 4,
  "features": ["Live classes", "Notes"]
}
```

### `PUT /courses/:id` (admin)

Partial update — same fields as create.

### `DELETE /courses/:id` (admin)

Deletes the course.

### Helpers

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/courses/:id` | Course detail (+ chapters, related) |
| `POST` | `/courses/:id/enroll` | Enroll / “Buy” |
| `POST` | `/courses/upload-thumbnail` | Multipart `thumbnail` file → `{ url }` |

---

## Chapters

### `GET /chapters` (admin)

Requires `?courseId=<uuid>`. Optional `search`.

Returns chapters ordered by `sort_order` (includes drafts). `is_locked` is always `false` for admin.

### `POST /chapters` (admin)

```json
{
  "course_id": "uuid",
  "title": "Chapter 1",
  "description": "",
  "duration_seconds": 0,
  "video_count": 0,
  "pdf_count": 0,
  "notes_count": 0,
  "video_url": null,
  "is_free_preview": false,
  "is_published": true,
  "sort_order": 0
}
```

If `sort_order` is `0`/omitted, API appends after the last chapter.

### `PUT /chapters/:id` (admin)

Partial update of chapter fields.

### `DELETE /chapters/:id` (admin)

Deletes the chapter.

### `PUT /chapters/reorder` (admin)

```json
{
  "courseId": "uuid",
  "orderedIds": ["chapter-uuid-1", "chapter-uuid-2"]
}
```

`orderedIds` must list **every** chapter for that course exactly once. Persists `sort_order` as 10, 20, 30…

### Chapter content (videos / PDFs / notes)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/chapters/:id/contents` | List content for a chapter (admin) |
| `POST` | `/chapters/:id/contents` | Add video / pdf / note |
| `PUT` | `/contents/:id` | Update one content row |
| `DELETE` | `/contents/:id` | Delete content |

`POST` body example (video):

```json
{
  "content_type": "video",
  "title": "Introduction",
  "url": "https://example.com/video.mp4",
  "duration_seconds": 600
}
```

`content_type`: `video` | `pdf` | `note`  
- video/pdf → `url` required  
- note → `body` text (or url)  

Counts on the chapter (`video_count`, `pdf_count`, `notes_count`, `duration_seconds`) sync automatically.

### Student nested routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/courses/:id/chapters` | Published chapters; `is_locked` from enrollment / free preview |
| `GET` | `/courses/:id/chapters/:chapterId` | Content (videos / PDFs / notes); empty when locked |

---

## Categories

### `GET /categories`

- **Admin** → all categories.
- **Student** → active only; optional `?search=`.

### `POST /categories` (admin)

```json
{
  "name": "Mathematics",
  "slug": "mathematics",
  "icon": "calculator",
  "sort_order": 10,
  "is_active": true
}
```

---

## Related (dashboard / banners)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/dashboard` | Home payload: banners, categories, featured, my courses, updates |
| `GET` | `/banners` | Active banners for slider |
| `GET` | `/admin/teachers` | Instructor/admin profiles for course form |

Legacy `/admin/courses…` and `/admin/chapters…` aliases still work; prefer the flat paths above.

---

## Local admin bootstrap

In `apps/api/.env`:

```env
ADMIN_EMAILS=you@example.com
```

Or in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```
