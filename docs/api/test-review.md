# Review Screen

Post-attempt answer review: question, selected answer, correct answer, explanation.

Route: `TestReview` · Entry: Result → **Review Answers**

---

## Architecture

```
ResultScreen
   │  "Review Answers"
   ▼
ReviewScreen  (ScrollView)
   │  useAttemptResultQuery(attemptId)
   │  GET /student/attempts/:id/result
   ▼
review[]  (only after submit — keys + explanations included)
   ▼
ReviewQuestionCard × N
   · Question text
   · Selected answer  (green if correct, red if wrong)
   · Correct answer   (always green highlight)
   · Explanation
```

**Why reuse result API?** Scoring already builds `review[]` with `selected_answer`, `correct_answer`, `explanation`, and `outcome`. No extra endpoint — Review Screen is a read-only presentation of that payload.

**Security:** Correct answers never leave the API while `status === in_progress`.

---

## Components

| Piece | Role |
|-------|------|
| **`ReviewScreen`** | Header + scrollable list of cards |
| **`ReviewQuestionCard`** | One MCQ: Q / Selected / Correct / Explanation |
| **`useAttemptResultQuery`** | Cached `TestAttemptResult` (shared with Result Screen) |

### Color rules

| Outcome | Card / selected text |
|---------|----------------------|
| Correct | Green border + green selected |
| Wrong | Red border + red selected; correct still green |
| Skipped | Muted; selected = “Not answered” |

---

## Data shape (per card)

```ts
{
  question_text,
  selected_answer: 'A'|'B'|'C'|'D'|null,
  correct_answer: 'A'|'B'|'C'|'D',
  explanation,
  outcome: 'correct' | 'wrong' | 'skipped'
}
```

See also: [Test Results](./test-results.md).
