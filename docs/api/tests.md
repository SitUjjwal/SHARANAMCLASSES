# Test Series API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin mutations require `profiles.role = admin` (or `ADMIN_EMAILS`).

**Scope (this module):** Test metadata — type, course/chapter assignment, duration, marks, publish.  
**Questions:** see [questions.md](./questions.md) (MCQ bank + Excel import).  
**Next:** Attempt **submit** + scoring / results.

Related: [Test Screen](./test-screen.md) (timer, palette, auto-save).

Migration: `infra/supabase/migrations/20260802010000_tests.sql`

---

## Architecture

```
Admin UI (/tests)
   │
   ▼
features/tests/api.ts
   │
   ▼
test.routes.ts  →  requireAuth + requireAdmin
   │
   ▼
test.controller.ts  →  test.service.ts
   │
   ▼
Supabase `tests` table
```

Products catalog already allows `product_type = test_series` for future paid unlocks; this module stores the exam entity itself.

---

## Test types

| `test_type` | UI label | Course | Chapter |
|-------------|----------|--------|---------|
| `chapter_test` | Chapter Test | **Required** | **Required** |
| `subject_test` | Subject Test | **Required** | Optional |
| `mock_test` | Mock Test | Optional | Optional |
| `previous_year` | Previous Year Test | Optional | Optional |
| `daily_quiz` | Daily Quiz | Optional | Optional |

Validation: `passing_marks <= total_marks`, `duration_minutes >= 1`.

---

## Admin APIs

### `GET /tests`

List tests (paginated). **Admin only.**

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `courseId` | uuid | — | Filter by assigned course |
| `chapterId` | uuid | — | Filter by assigned chapter |
| `search` | string | `""` | Match title / description / instructions |
| `testType` | enum \| `all` | `all` | One of the five types |
| `access` | `free` \| `paid` \| `all` | `all` | Free flag filter |
| `status` | `published` \| `draft` \| `all` | `all` | Publish flag |
| `page` | int | `1` | Page number |
| `pageSize` | int | `20` | Max 100 |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Real Numbers — Chapter Test",
        "description": "",
        "instructions": "No calculators.",
        "test_type": "chapter_test",
        "course_id": "uuid",
        "chapter_id": "uuid",
        "duration_minutes": 60,
        "total_marks": 100,
        "passing_marks": 33,
        "sort_order": 0,
        "is_free": false,
        "is_published": true,
        "course_title": "Class 10 Maths",
        "chapter_title": "Real Numbers",
        "created_at": "…",
        "updated_at": "…"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "hasMore": false
  }
}
```

---

### `GET /tests/:id`

Fetch one test by id. **Admin only.**

**404** `TEST_NOT_FOUND` if missing.

---

### `POST /tests`

Create a test. **Admin only.**

```json
{
  "title": "Real Numbers — Chapter Test",
  "description": "Syllabus chapter exam",
  "instructions": "40 questions. No negative marking.",
  "test_type": "chapter_test",
  "course_id": "uuid",
  "chapter_id": "uuid",
  "duration_minutes": 60,
  "total_marks": 100,
  "passing_marks": 33,
  "sort_order": 0,
  "is_free": false,
  "is_published": false
}
```

| Field | Rule |
|-------|------|
| `title` | 2–160 chars |
| `test_type` | One of five enums |
| `course_id` / `chapter_id` | UUID or null; chapter must belong to course |
| `duration_minutes` | Integer 1–1440 |
| `total_marks` / `passing_marks` | Positive; passing ≤ total |
| `is_published` | Default `false` (draft until ready) |

**201** returns the created `Test` (with `course_title` / `chapter_title` when assigned).

**Common errors**

| Code | When |
|------|------|
| `VALIDATION_ERROR` | Zod schema failed |
| `CHAPTER_TEST_REQUIRES_ASSIGNMENT` | Chapter test missing course/chapter |
| `SUBJECT_TEST_REQUIRES_COURSE` | Subject test missing course |
| `CHAPTER_COURSE_MISMATCH` | Chapter not under course |
| `COURSE_NOT_FOUND` / `CHAPTER_NOT_FOUND` | Bad FK |

---

### `PUT /tests/:id`

Partial update. Same body fields as create (all optional). Re-validates assignment rules on the **merged** row.

**200** updated `Test`.

---

### `DELETE /tests/:id`

Hard delete. **Admin only.**

**200** `{ "success": true, "data": null, "message": "Test deleted" }`  
**404** if already gone.

---

## Student API

### `GET /student/tests`

Published tests for the signed-in student.

| Query | Description |
|-------|-------------|
| `courseId` | Optional filter |
| `chapterId` | Optional filter |
| `testType` | Optional type filter |

**Lock rule:** `is_locked = false` when `is_free` **or** student has access to `course_id` (enrollment/purchase). Instructions are stripped when locked.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Daily Quiz — Algebra",
        "test_type": "daily_quiz",
        "duration_minutes": 15,
        "total_marks": 20,
        "passing_marks": 8,
        "is_free": true,
        "is_locked": false,
        "instructions": "…"
      }
    ]
  }
}
```

---

## Admin UI

Route: `/tests` (sidebar **Test Series**)

- Create / Edit / Delete  
- Filters: course, type, free/paid, published/draft, search  
- Form fields match the create API  

---

## File map

| File | Role |
|------|------|
| `infra/supabase/migrations/20260802010000_tests.sql` | Table + RLS |
| `packages/shared/src/types/course.ts` | `Test`, `TestType`, `TEST_TYPE_LABELS` |
| `apps/api/src/validators/test.validators.ts` | Zod |
| `apps/api/src/services/test.service.ts` | Business rules |
| `apps/api/src/controllers/test.controller.ts` | HTTP |
| `apps/api/src/routes/test.routes.ts` | Routes |
| `apps/admin/src/pages/TestsPage.tsx` | List UI |
| `apps/admin/src/features/tests/*` | Form + API client |
