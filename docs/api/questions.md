# Question Management API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`  
Admin: `requireAuth` + `requireAdmin`

Migration: `infra/supabase/migrations/20260802020000_questions.sql`

---

## Architecture

```
Admin UI  /tests/:testId/questions
        │
        ▼
features/questions/api.ts
        │  GET|POST /tests/:testId/questions
        │  POST     /tests/:testId/questions/import  (multipart Excel)
        │  PUT|DELETE /questions/:id
        ▼
question.routes.ts
        │  excelUpload (multer) for import
        ▼
question.controller.ts → question.service.ts
        │  Zod validation (4 options, answer A–D, marks ≥ negative)
        │  ExcelJS parses .xlsx → validated rows → insert
        ▼
Supabase public.questions  (FK → tests ON DELETE CASCADE)
```

**Security**

- Admin list/detail includes `correct_answer` + `explanation`
- Student `GET /student/tests/:testId/questions` returns **no** answer or explanation (attempt scoring comes later)
- Excel import capped at **500** rows / **5MB**

---

## Data model

| Column | Rule |
|--------|------|
| `question_text` | Required |
| `option_a` … `option_d` | Four required options |
| `correct_answer` | `A` \| `B` \| `C` \| `D` |
| `explanation` | Optional |
| `marks` | `> 0` |
| `negative_marks` | `≥ 0` and `≤ marks` |
| `sort_order` | Display order |

---

## Admin APIs

### `GET /tests/:testId/questions`

Paginated question bank for one test.

| Query | Default | Description |
|-------|---------|-------------|
| `search` | `""` | Match stem / options / explanation |
| `page` | `1` | |
| `pageSize` | `20` | Max 100 |

**Response:** `{ items, page, pageSize, total, hasMore }`

---

### `POST /tests/:testId/questions`

Add one MCQ.

```json
{
  "question_text": "√2 is a … number?",
  "option_a": "Natural",
  "option_b": "Rational",
  "option_c": "Irrational",
  "option_d": "Integer",
  "correct_answer": "C",
  "explanation": "√2 cannot be expressed as p/q.",
  "marks": 1,
  "negative_marks": 0.25,
  "sort_order": 1
}
```

**201** created `Question`.

**Validation errors:** empty options, invalid answer, `negative_marks > marks`, missing test (`TEST_NOT_FOUND`).

---

### `GET /questions/:id`

Admin detail (includes correct answer).

---

### `PUT /questions/:id`

Partial update (same fields as create, all optional). Re-checks marks vs negative marks on the merged values.

---

### `DELETE /questions/:id`

Hard delete.

---

### `POST /tests/:testId/questions/import`

Multipart field **`file`**: `.xlsx` or `.xls`.

**Required Excel headers** (aliases accepted):

`question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`  

Optional: `explanation`, `marks` (default 1), `negative_marks` (default 0), `sort_order`

**Response**

```json
{
  "success": true,
  "data": {
    "imported": 48,
    "skipped": 2,
    "errors": [{ "row": 5, "message": "…" }]
  },
  "message": "Imported 48 question(s), skipped 2"
}
```

Invalid rows are skipped; valid rows still import (partial success).

---

## Student API

### `GET /student/tests/:testId/questions`

Published attempt payload — **no** `correct_answer` / `explanation`.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "test_id": "uuid",
        "question_text": "…",
        "option_a": "…",
        "option_b": "…",
        "option_c": "…",
        "option_d": "…",
        "marks": 1,
        "negative_marks": 0.25,
        "sort_order": 1
      }
    ]
  }
}
```

---

## Admin UI

1. **Test Series** → **Questions** on a row  
2. Route `/tests/:testId/questions`  
3. Add / Edit / Delete, search, pagination  
4. **Bulk Import Excel**

---

## File map

| File | Role |
|------|------|
| `infra/supabase/migrations/20260802020000_questions.sql` | Table + RLS |
| `packages/shared` | `Question`, `QuestionPublic`, `QuestionBulkImportResult` |
| `apps/api/src/validators/question.validators.ts` | Zod |
| `apps/api/src/services/question.service.ts` | CRUD + ExcelJS import |
| `apps/api/src/controllers/question.controller.ts` | HTTP |
| `apps/api/src/routes/question.routes.ts` | Routes |
| `apps/admin/src/pages/QuestionsPage.tsx` | UI |
| `apps/admin/src/features/questions/*` | Form + client |
