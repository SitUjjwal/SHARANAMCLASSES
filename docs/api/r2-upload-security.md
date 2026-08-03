# Cloudflare R2 Upload Security

Architecture for securing multipart uploads to Cloudflare R2 in `@sharanam/api`.

## Architecture

```
Client (multipart)
    │
    ▼
┌─────────────────────────────┐
│ 1. Multer (memory)          │  Size limit + declared MIME + dangerous-ext deny
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 2. validateSecureUpload     │  Magic-byte MIME · size · extension · metadata scan · SHA-256
│    (fileSecurity.ts)        │  Original name → display only (never used as object key)
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 3. Content-addressed key    │  `{prefix}/{sha256}.{canonicalExt}`
│    HeadObject               │  If exists → skip Put (dedupe) · return existing URLs
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 4. PutObject + Metadata     │  content-sha256, original-filename, upload-kind
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 5. URLs                     │  public `R2_PUBLIC_BASE_URL/key` + signed GetObject URL
└─────────────────────────────┘
```

| Layer | File | Responsibility |
|-------|------|----------------|
| Multer gate | `middlewares/upload.ts` | Early reject: size, client MIME allowlist, dangerous extensions (`.exe`, `.php`, `.html`, `.svg`, …) |
| Content security | `integrations/r2/fileSecurity.ts` | Magic sniff, MIME mismatch, metadata heuristics, hash, rename rules |
| R2 I/O | `integrations/r2/client.ts` | `securePutToR2`, Head/Put/Delete, `createSignedR2Url` |
| Domain services | `pdf-upload`, `profileAvatar`, `bugReport`, `systemSettings` | Choose prefix/kind; persist URL + storage_key in Postgres |

## Requirement map

| Requirement | Implementation |
|-------------|----------------|
| **Validate MIME** | Magic bytes (`%PDF`, JPEG/PNG/WebP signatures). Client `Content-Type` must match or be `octet-stream`. |
| **Validate file size** | Multer limits + profile max (`pdf` 25MB, `image` 5MB, `logo` 2MB). |
| **Rename uploaded files** | Keys are `{prefix}/{sha256}.{ext}` — never the client filename. Display name sanitized for DB only. |
| **Prevent duplicate uploads** | Same bytes → same key; `HeadObject` + `skipIfExists` skips re-upload (`deduplicated: true`). |
| **Scan metadata** | PDF: reject `/JavaScript`, `/OpenAction`, `/Launch`, `/EmbeddedFile`, … · Images: reject embedded script/PHP markers; warn on EXIF. |
| **Reject dangerous extensions** | Deny list on all filename segments (blocks `file.pdf.exe` and similar). SVG blocked (XSS). |
| **Generate secure URLs** | `createSignedR2Url` (presigned GetObject, TTL `R2_SIGNED_URL_TTL_SECONDS`, default 3600s). Public URL still returned for CDN-friendly assets. |

## Upload kinds

- `pdf` → `pdfs/{hash}.pdf`
- `image` → `avatars/{userId}/{hash}.{ext}` or `bug-screenshots/{userId}/…`
- `logo` → `branding/logo/{hash}.{ext}` (SVG **not** allowed)

Server-generated certificates still use stable keys (`certificates/{userId}/{id}.pdf`) so re-issue can overwrite; they are not user multipart uploads.

## Env

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=   # no trailing slash
R2_ENDPOINT=          # optional
R2_SIGNED_URL_TTL_SECONDS=3600
```

## Residual limits

- Metadata scan is heuristic, **not** antivirus / ClamAV.
- EXIF is detected but not stripped (needs an image pipeline like Sharp for rewrite).
- Public bucket URLs remain usable if the R2 bucket/custom domain is public — prefer private bucket + signed URLs for PDFs in production.
- Thumbnails/materials still on **Supabase Storage** today; migrate those paths to `securePutToR2` when moving them to R2.
