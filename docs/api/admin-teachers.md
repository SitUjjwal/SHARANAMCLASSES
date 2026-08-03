# Admin Teachers

Production teacher management (`/teachers`).

## Architecture

```
Admin UI (React + Vite)
  TeachersPage → list / search / add / edit / delete
  TeacherDetailPanel → stats + assign courses + assign live classes
  features/teachers/api.ts → typed HTTP client
        │
        ▼
Express API (requireAuth + requireAdmin)
  teacher.routes.ts → teacher.controller.ts → teacher.service.ts
        │
        ▼
Supabase
  profiles (role = instructor | admin)     ← teacher identity
  courses.teacher_id / teacher_name        ← course assignment
  live_classes.teacher_id                  ← live class assignment
  enrollments / student_feedback           ← stats aggregates
```

**Design choices**
- Teachers are not a separate table — they are `profiles` with `role = instructor` (admins also appear for assignment).
- **Delete** demotes instructor → student and clears `courses.teacher_id` + `live_classes.teacher_id` (account preserved).
- **Assign** uses replace semantics (`PUT` with full id lists).
- Course form teacher dropdown still works via `GET /admin/teachers`.

## Migration

Apply `infra/supabase/migrations/20260803030000_live_classes_teacher.sql`  
(adds `live_classes.teacher_id`).

## Backend APIs

All require admin Bearer token.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/teachers` | List teachers + `course_count` / `live_class_count` |
| `POST` | `/admin/teachers` | Add teacher (create auth user or promote student) |
| `GET` | `/admin/teachers/:id` | Detail: teacher + stats + courses + live classes |
| `GET` | `/admin/teachers/:id/stats` | Statistics only |
| `PATCH` | `/admin/teachers/:id` | Edit name / phone (syncs `courses.teacher_name`) |
| `DELETE` | `/admin/teachers/:id` | Demote + clear assignments |
| `GET` | `/admin/teachers/:id/courses` | Assigned courses |
| `GET` | `/admin/teachers/:id/assignable-courses` | Unassigned or already theirs |
| `PUT` | `/admin/teachers/:id/courses` | Body `{ course_ids: uuid[] }` — replace set |
| `GET` | `/admin/teachers/:id/live-classes` | Assigned live classes |
| `GET` | `/admin/teachers/:id/assignable-live-classes` | Unassigned or already theirs |
| `PUT` | `/admin/teachers/:id/live-classes` | Body `{ live_class_ids: uuid[] }` — replace set |

### Create body

```json
{
  "full_name": "…",
  "email": "…",
  "phone_number": "…",
  "password": "…",
  "promote_if_exists": true
}
```

### Stats fields

| Field | Meaning |
|-------|---------|
| `courses_assigned` / `courses_published` | Courses with `teacher_id` |
| `total_enrollments` | Enrollments on those courses |
| `live_classes_assigned` / `_upcoming` / `_today` | Live classes with `teacher_id` |
| `feedback_count` | `student_feedback` rows for teacher |

## Admin UI

- `/teachers` — Add / Edit / Delete / View
- **View** opens panel: Statistics · Assign courses · Assign live classes

## Files

| Layer | Path |
|-------|------|
| Shared types | `packages/shared/src/types/adminTeachers.ts` |
| Service | `apps/api/src/services/teacher.service.ts` |
| Routes | `apps/api/src/routes/teacher.routes.ts` |
| UI page | `apps/admin/src/pages/TeachersPage.tsx` |
| Detail | `apps/admin/src/features/teachers/TeacherDetailPanel.tsx` |
