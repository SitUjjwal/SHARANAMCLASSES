# Certificates

Course-completion certificates with **admin approval** and **PDF** download/share.

## Architecture

```
Course reaches 100% progress
  (last chapter opened / POST /certificates/request)
        │
        ▼
  certificates row  status = pending_approval
        │
        ▼
  Admin Approves  (POST /admin/certificates/:id/approve)
        │
        ├─ assign certificate_number  (SCYYYY##### e.g. SC202600001)
        ├─ pdf-lib → certificate PDF (template below)
        ├─ upload Cloudflare R2 (certificates/{userId}/{id}.pdf)
        └─ status = issued + issued_at + certificate_url
        │
        ▼
  Mobile Profile → Certificates → Viewer
        ├─ Certificate Number
        ├─ Issue Date
        ├─ Download PDF  (expo-file-system + share sheet)
        └─ Share
```

## PDF template

```
SHARANAM CLASSES
Certificate of Completion
This certifies that
{Student Name}
has successfully completed
{Course Title}
Issued on
{D Month YYYY}
Certificate ID
{SCYYYY#####}
```

## Status machine

| Status | Meaning |
|--------|---------|
| `pending_approval` | Course completed; waiting for admin |
| `issued` | Approved; PDF + number available |
| `rejected` | Admin rejected (student may re-request) |

## API

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/certificates` | Student — pending + issued |
| `GET` | `/certificates/:id` | Student |
| `POST` | `/certificates/request` | Student — `{ course_id }` (requires 100%) |
| `GET` | `/admin/certificates?status=` | Admin |
| `POST` | `/admin/certificates/:id/approve` | Admin → PDF |
| `POST` | `/admin/certificates/:id/reject` | Admin |
| `PATCH` | `/admin/certificates/:id` | Admin edit (name / course title / description; regenerates PDF if issued) |

## Auto-request

When `PATCH /my-courses/:courseId/last-watched` advances chapter progress to **100%**, the API calls `maybeRequestCertificateOnCompletion`.

## Migration

`infra/supabase/migrations/20260802210000_certificates_workflow.sql`
