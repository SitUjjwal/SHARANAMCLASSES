# Test Screen (student attempt UI)

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

Migration: `infra/supabase/migrations/20260802030000_test_attempts.sql`

---

## Architecture

```
Profile → TestListScreen
            │  GET  /student/tests
            │  POST /student/tests/:testId/attempts   (start or resume)
            ▼
         TestScreen (attemptId)
            │  GET  /student/attempts/:attemptId
            │  PUT  /student/attempts/:attemptId/answers  (auto-save)
            ▼
         attempt.service.ts → test_attempts + test_attempt_answers
                              + questions (no correct_answer)
```

**Security**

- Correct answers / explanations never returned during an attempt
- One `in_progress` attempt per user + test
- Save rejected after `ends_at` (status → `expired`)
- Locked tests require course enrollment / purchase

---

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/student/tests/:testId/attempts` | Start or resume → `TestAttemptSession` |
| `GET` | `/student/attempts/:attemptId` | Reload session |
| `PUT` | `/student/attempts/:attemptId/answers` | Auto-save answers + current index |
| `POST` | `/student/attempts/:attemptId/pause-credit` | Extend `ends_at` after background pause |
| `POST` | `/student/attempts/:attemptId/submit` | Manual or timer auto-submit (locks attempt) |

### Save body

```json
{
  "current_question_index": 2,
  "answers": [
    {
      "question_id": "uuid",
      "selected_answer": "B",
      "is_marked_for_review": true
    }
  ]
}
```

`selected_answer` may be `null` (Clear Answer).

---

## Mobile components (every piece)

| Component | Job |
|-----------|-----|
| **`TestListScreen`** | Lists published tests; **Start / Resume** creates or continues an attempt and navigates to `TestAttempt`. |
| **`TestScreen`** | Orchestrator: hydrates answers, owns current index, wires timer/progress/card/actions/palette + auto-save. Shows one question at a time. |
| **`Timer`** (reusable) | Countdown chip: pause in background, low-time warning, auto-submit at 0. See [timer.md](./timer.md). |
| **`TestProgressBar`** | `answered / total` fill bar. Counts questions with a selected option only. |
| **`QuestionCard`** | Stem + marks meta + four options for the **current** index only. |
| **`OptionChoice`** | Single A/B/C/D radio row; accent when selected; disabled when time is up. |
| **`TestActionBar`** | **Previous** / **Next**, **Mark for review** (toggle), **Clear answer** (nulls selection). |
| **`QuestionPalette`** | Number grid to jump any question. Legend: current / answered / review / blank. |
| **`useAutoSaveAnswers`** | Debounces (~800ms) local `AnswerMap` → `PUT …/answers`. `flush()` on back / expire. |
| **`useAttemptSessionQuery`** | React Query load of `TestAttemptSession`. |
| **`useStudentTestsQuery`** | React Query list for TestListScreen. |

### Answer state model

```ts
AnswerMap[questionId] = {
  selected_answer: 'A' | 'B' | 'C' | 'D' | null,
  is_marked_for_review: boolean,
}
```

---

## How to open

1. Apply migration `20260802030000_test_attempts.sql`
2. Restart API
3. Mobile: **Profile → Test Series → Start / Resume**

---

## Out of scope (next)

- (none for leaderboard — see [Leaderboard](./leaderboard.md))
