# PDFs API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

**Storage rule:** PDF **binary** → Cloudflare R2. PostgreSQL stores **only** the returned URL + metadata (`storage_key`, size, filename).

---

## Upload flow

```
Admin UI ──multipart──► POST /pdfs/upload
                           │
                           ├─ validate MIME = application/pdf
                           ├─ max 25MB
                           ├─ magic bytes must start with %PDF
                           │
                           ▼
                     Cloudflare R2 PutObject
                           │
                           ▼
                     { file_url, storage_key, file_size, … }
                           │
Admin UI ──JSON─────────► POST /pdfs  (assign course + chapter + title)
                           │
                           ▼
                     PostgreSQL public.pdfs row
```

On **edit replace**: upload again → `PUT /pdfs/:id` with new `file_url` + `storage_key` → old R2 object deleted.  
On **delete**: DB row removed → R2 object deleted.

Local/dev without R2 env: falls back to Supabase `chapter-materials` (logged warning). Production **requires** R2.

---

## Admin

### `POST /pdfs/upload`

Multipart field: `file` (PDF only).

Response `data`:

```json
{
  "file_url": "https://cdn.example.com/pdfs/… .pdf",
  "storage_key": "pdfs/… .pdf",
  "file_size": 123456,
  "mime_type": "application/pdf",
  "original_filename": "notes.pdf",
  "storage_provider": "r2"
}
```

| Validation | Rule |
|------------|------|
| MIME | `application/pdf` only |
| Size | 1 byte – 25MB |
| Content | Buffer must start with `%PDF` |
| Extension | `.pdf` when filename provided |

---

### `GET /pdfs`

| Query | Values | Notes |
|-------|--------|--------|
| `courseId` | uuid | Filter by course |
| `chapterId` | uuid | Filter by chapter |
| `search` | string | Title / description / filename |
| `access` | `free` \| `paid` \| `all` | Default `all` |
| `status` | `published` \| `draft` \| `all` | Default `all` |
| `page` / `pageSize` | number | Default `1` / `20` (max 100) |

---

### `POST /pdfs`

Create after upload.

```json
{
  "course_id": "uuid",
  "chapter_id": "uuid",
  "title": "Chapter 1 Notes",
  "description": "",
  "file_url": "https://…",
  "storage_key": "pdfs/…",
  "file_size": 123456,
  "mime_type": "application/pdf",
  "original_filename": "notes.pdf",
  "sort_order": 0,
  "is_free": false,
  "is_published": true
}
```

Chapter must belong to course. `sort_order` `0` → auto append (`last + 10`). Syncs chapter `pdf_count`.

---

### `PUT /pdfs/:id` / `DELETE /pdfs/:id`

Partial update (re-assign course/chapter allowed).  
`file_url` + `storage_key` must be sent together when replacing the file.

---

## Student (via chapter detail)

`GET /courses/:courseId/chapters/:chapterId` includes:

- `pdfs: PdfPublic[]` — `file_url` is `null` when paid + not enrolled (`is_locked`)
- Mirrored into `contents[]` as `content_type: 'pdf'` for older clients

---

## Env (Cloudflare R2)

Put these in `apps/api/.env` (never commit real keys; never paste them into docs).

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=sharanam-pdfs
# Must be a PUBLIC base (R2.dev or custom domain) — NOT the S3 API host
R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
# optional; defaults to https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
R2_ENDPOINT=
```

**Public URL setup (Cloudflare dashboard):** R2 → bucket `sharanam-pdfs` → Settings → Public access → Allow Access → copy the `https://pub-….r2.dev` URL into `R2_PUBLIC_BASE_URL`.

Migration: `infra/supabase/migrations/20260731160000_pdfs.sql`
