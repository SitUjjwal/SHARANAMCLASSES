# Content & media APIs

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

---

## Student read APIs

Protected by `requireAuth` + **course access middleware** (see [course-access-middleware.md](./course-access-middleware.md)).

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/courses/:courseId/content` | All published chapters + videos/pdfs/notes + course live classes |
| `GET` | `/chapters/:chapterId/videos` | Full URLs if purchased/enrolled; else free preview only |
| `GET` | `/chapters/:chapterId/pdfs` | Chapter PDFs (same lock rule) |
| `GET` | `/chapters/:chapterId/notes` | Chapter notes (same lock rule) |
| `GET` | `/live-classes` | Published list for students (`?courseId=` optional) |
| `GET` | `/live-classes/public` | Alias of student list (older clients) |

Also available (unchanged):

- `GET /courses/:id/chapters/:chapterId` — single chapter detail (legacy nested shape)
- `GET /courses/:id/chapters` — chapter list only

### `GET /courses/:courseId/content`

```json
{
  "success": true,
  "data": {
    "course_id": "…",
    "course_title": "…",
    "enrolled": true,
    "access_mode": "full",
    "chapters": [
      {
        "id": "…",
        "title": "…",
        "is_locked": false,
        "videos": [],
        "pdfs": [],
        "notes": []
      }
    ],
    "live_classes": []
  }
}
```

`access_mode`: `full` (purchased/enrolled) or `preview` (free `is_free` media only unlocked). Locked media may still appear in the list with URLs withheld.

---

## Admin write APIs

| Method | Path | Resource |
|--------|------|----------|
| `POST` | `/videos` | Create video |
| `PUT` | `/videos/:id` | Update video |
| `DELETE` | `/videos/:id` | Delete video |
| `POST` | `/pdfs` | Create PDF (metadata; upload via `/pdfs/upload`) |
| `PUT` | `/pdfs/:id` | Update PDF |
| `DELETE` | `/pdfs/:id` | Delete PDF |
| `POST` | `/notes` | Create note |
| `PUT` | `/notes/:id` | Update note (extra; not required by all clients) |
| `DELETE` | `/notes/:id` | Delete note |
| `POST` | `/live-classes` | Create live class |

Admin list/detail for live classes uses the same `GET /live-classes` when the caller is an admin (paginated + filters). See [live-classes.md](./live-classes.md), [videos.md](./videos.md), [pdfs.md](./pdfs.md), [notes.md](./notes.md).
