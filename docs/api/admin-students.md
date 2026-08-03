# Admin Students

Production student management for the admin panel (`/students`).

## Features

- View / search / filter (class, medium, active/suspended)
- Suspend / activate (profile flag + Supabase Auth ban)
- Reset password (temporary password returned once)
- Purchased courses (enrollments)
- Test history (submitted/expired attempts)
- Payments (payment_orders for that user)
- Export Excel (`.xlsx` via ExcelJS)

## Migration

Apply `infra/supabase/migrations/20260803020000_student_suspension.sql`:

- `profiles.is_suspended`
- `profiles.suspended_at`
- `profiles.suspended_reason`

## Backend APIs

All routes require `Authorization: Bearer <access_token>` and **admin** role (`requireAuth` + `requireAdmin`).

Success shape: `{ "success": true, "data": ... }`  
Error shape: `{ "success": false, "error": { "code", "message" } }`

### List students

`GET /admin/students`

| Query | Type | Notes |
|-------|------|--------|
| `search` | string | Matches `full_name`, `email`, `phone_number` (ilike) |
| `class_level` | enum | `6`…`12`, `competitive`, `computer`, or empty |
| `medium` | `hindi` \| `english` \| empty | |
| `status` | `all` \| `active` \| `suspended` | Default `all` |
| `page` | int ≥ 1 | Default `1` |
| `pageSize` | 1–100 | Default `25` |

**Response `data`:** `{ items: AdminStudent[], page, pageSize, total, totalPages }`

`AdminStudent` includes `is_suspended`, `suspended_at`, `suspended_reason`, `enrolled_courses`.

---

### Export Excel

`GET /admin/students/export`

Same query filters as list (exports up to 2000 matching rows).

**Response `data`:**

```json
{
  "filename": "students-2026-08-03.xlsx",
  "base64": "<xlsx bytes>",
  "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

---

### Get student

`GET /admin/students/:studentId`

**Response `data`:** single `AdminStudent` (404 if not a student).

---

### Update profile

`PATCH /admin/students/:studentId`

Body (at least one field):

```json
{
  "full_name": "…",
  "phone_number": "…",
  "class_level": "10",
  "medium": "hindi"
}
```

Writes an `student.update` activity log when ops tables exist.

---

### Suspend

`POST /admin/students/:studentId/suspend`

```json
{ "reason": "optional text" }
```

Sets `is_suspended=true` and bans the Auth user (`ban_duration: 876000h`) so login fails.

---

### Activate

`POST /admin/students/:studentId/activate`

Clears suspension fields and sets Auth `ban_duration: none`.

---

### Reset password

`POST /admin/students/:studentId/reset-password`

```json
{ "new_password": "optional-admin-chosen" }
```

If `new_password` omitted, API generates a strong temporary password.

**Response `data`:**

```json
{
  "student_id": "…",
  "email": "…",
  "temporary_password": "…",
  "message": "…"
}
```

Shown once in the admin UI — share securely with the student.

---

### Purchased courses

`GET /admin/students/:studentId/courses`

**Response `data`:** array of

| Field | Meaning |
|-------|---------|
| `enrollment_id` | Enrollment row id |
| `course_id` / `course_title` | Course |
| `progress_percent` | 0–100 |
| `enrolled_at` | ISO timestamp |
| `is_published` | Course publish flag |

---

### Test history

`GET /admin/students/:studentId/tests`

Submitted/expired attempts (max 100), newest first:

| Field | Meaning |
|-------|---------|
| `attempt_id` / `test_id` / `test_title` | Attempt + test |
| `obtained_marks` / `total_marks` / `percentage` | Score |
| `is_passed` | Pass/fail |
| `submitted_at` | When submitted |

---

### Payments

`GET /admin/students/:studentId/payments`

Payment orders for that user (max 100):

| Field | Meaning |
|-------|---------|
| `order_id` | `payment_orders.id` |
| `course_title` | Resolved title |
| `amount_display` | INR string |
| `status` | `created` / `paid` / `failed` / … |
| `payment_id` | Razorpay payment id |
| `created_at` / `paid_at` | Timestamps |

---

## Admin UI

- `/students` — FilterBar + table + Export Excel
- **View** opens detail panel: Overview / Courses / Tests / Payments
- Actions: Edit, Suspend, Activate, Reset password

## Files

| Area | Path |
|------|------|
| Service | `apps/api/src/services/studentAdmin.service.ts` |
| Routes | `apps/api/src/routes/studentAdmin.routes.ts` |
| UI | `apps/admin/src/pages/StudentsPage.tsx` |
| Detail | `apps/admin/src/features/students/StudentDetailPanel.tsx` |
| Types | `packages/shared/src/types/adminStudents.ts` |
