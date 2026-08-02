# Announcement Module

Admin CRUD for Home announcements: rich text, image, schedule, pin.

---

## Architecture

```
Admin AnnouncementsPage
   Create / Edit / Delete / Pin / Schedule / Upload
              │
              ▼
 POST|PATCH|DELETE /admin/announcements
 POST /admin/announcements/upload-image
              │
              ▼
        public.announcements
   body (HTML) · image_url · is_pinned
   is_published · scheduled_at
              │
              ▼
 GET /announcements
 GET /dashboard → announcements[]
              │
              ▼
 Home → AnnouncementsList (pinned first)
```

**Visibility rule:** `is_published = true` **and** `scheduled_at <= now()`.  
**Order:** pinned first, then newest `scheduled_at`.

---

## APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/announcements` | student | Published + due announcements |
| `GET` | `/admin/announcements` | admin | All (draft / scheduled / live) |
| `POST` | `/admin/announcements` | admin | Create |
| `PATCH` | `/admin/announcements/:id` | admin | Edit / pin / schedule / publish |
| `DELETE` | `/admin/announcements/:id` | admin | Delete |
| `POST` | `/admin/announcements/upload-image` | admin | Multipart field `image` → URL |

### Create / update body

```json
{
  "title": "Holiday notice",
  "body": "<p>Classes closed on <b>Friday</b>.</p>",
  "image_url": "https://…",
  "is_pinned": true,
  "is_published": true,
  "scheduled_at": "2026-08-02T05:30:00.000Z",
  "sort_order": 0
}
```

| Field | Meaning |
|-------|---------|
| `body` | Rich HTML from admin editor |
| `image_url` | Optional hero image |
| `is_pinned` | Show at top of Home |
| `is_published` | Draft vs enabled |
| `scheduled_at` | When it becomes visible |

Dashboard also returns `announcements` (full) and `latest_updates` (plain-text compat).

---

## Setup

1. Apply `20260802140000_announcements.sql`
2. Restart API + admin
3. Admin → **Announcements** → Create

---

## Files

| Path | Role |
|------|------|
| `announcement.service.ts` | CRUD + Home query |
| `announcement.routes.ts` | REST mount |
| `AnnouncementForm.tsx` + `RichTextEditor.tsx` | Admin UI |
| `AnnouncementsPage.tsx` | List / pin / modal |
| `AnnouncementsList.tsx` | Mobile Home |
