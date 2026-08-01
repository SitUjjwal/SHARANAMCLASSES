# Test Result Screen

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

Migrations:

- `20260802030000_test_attempts.sql`
- `20260802040000_test_attempt_results.sql`

---

## Architecture

```
TestScreen
   │  flush answers
   │  POST /student/attempts/:id/submit  { reason: auto|manual }
   ▼
attempt.service.scoreAttempt()
   · correct  → +marks
   · wrong    → −negative_marks
   · skipped  → 0
   · percentage = clamp(obtained / total_marks × 100, 0–100)
   · is_passed  = obtained ≥ passing_marks
   · persist aggregates on test_attempts
   ▼
ResultScreen  ← also GET /student/attempts/:id/result
   · PassFailBadge
   · ResultStatGrid (total, obtained, correct, wrong, skipped, %)
   · PerformanceChart (bar chart)
   · Review Answers → ReviewScreen
                         (selected vs correct + explanation, green/red)
```

**Security:** Correct answers / explanations only after the attempt is no longer `in_progress`.

---

## APIs

| Method | Path | Returns |
|--------|------|---------|
| `POST` | `/student/attempts/:id/submit` | `TestAttemptResult` (scores + review) |
| `GET` | `/student/attempts/:id/result` | Same payload (409 if still in progress) |

### `TestAttemptResult`

```ts
{
  summary: {
    attempt_id, test_id, test_title, status,
    total_marks, passing_marks, obtained_marks,
    correct_count, wrong_count, skipped_count,
    percentage, is_passed, submitted_at
  },
  review: [{
    question_id, question_text, options A–D,
    selected_answer, correct_answer, explanation,
    outcome: 'correct' | 'wrong' | 'skipped', …
  }]
}
```

---

## Mobile components

| Component | Job |
|-----------|-----|
| **`ResultScreen`** | Orchestrates summary UI + Review CTA |
| **`PassFailBadge`** | Large PASS / FAIL vs passing marks |
| **`ResultStatGrid`** | Six stats: total, obtained, correct, wrong, skipped, % |
| **`PerformanceChart`** | View-based bar chart (correct / wrong / skipped) |
| **`ReviewScreen`** | Scrollable Q / selected / correct / explanation (green·red) |
| **`useAttemptResultQuery`** | React Query for result payload |

---

## How to open

1. Apply result migration
2. Restart API
3. Finish a test (Submit or timer auto-submit) → Result Screen
