# Test History

Student past test attempts: name, date, score, percentage, rank, View Result.

## APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/test-history?page=&pageSize=` | Student | Paginated Test History list (canonical) |
| `GET` | `/results?page=&pageSize=` | Student | Alias of `/test-history` |
| `GET` | `/results/:id` | Student | Full result (summary + review) — **View Result** |
| `GET` | `/student/attempts/:attemptId/result` | Student | Alias of `/results/:id` |

### List response item

```ts
{
  attempt_id: string
  test_id: string
  test_title: string      // Test Name
  submitted_at: string    // Date
  obtained_marks: number  // Score (numerator)
  total_marks: number     // Score (denominator)
  percentage: number
  rank: number | null     // Rank on this test (1 = best)
  is_passed: boolean
  // + correct/wrong/skipped counts, status, passing_marks
}
```

**Rank rules** (same as Leaderboard): among scored attempts for that test —
1. higher `percentage`
2. then higher `obtained_marks`
3. then faster `time_taken` (started → submitted)

### `GET /results/:id` (View Result)

Returns `{ summary, review[] }` for Result Screen (marks breakdown + answer review).

## Mobile

- Profile / Settings → **Test History**
- `useTestHistoryQuery` → `GET /results`
- **View Result** → `TestResult` screen → `GET /results/:attemptId`
