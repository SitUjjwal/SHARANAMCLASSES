# Leaderboard API

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>` (`requireAuth`)

Migration (indexes): `infra/supabase/migrations/20260802050000_leaderboard_indexes.sql`  
Requires scored attempts from `20260802040000_test_attempt_results.sql`.

---

## Backend APIs

### `GET /student/leaderboard`

Returns the **Top 100** students (best attempt per student) for the active filters.

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `courseId` | UUID | — | Only attempts on tests linked to this course |
| `testId` | UUID | — | Only attempts for this test (wins over course filter for test scope) |
| `date` | `YYYY-MM-DD` | — | `submitted_at` within that **UTC** calendar day |
| `limit` | 1–100 | `100` | Max rows returned |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rank": 1,
        "user_id": "…",
        "student_name": "Asha Kumar",
        "score": 42.5,
        "percentage": 85,
        "time_taken_seconds": 1820,
        "attempt_id": "…",
        "test_id": "…",
        "test_title": "Algebra Mock",
        "course_id": "…",
        "submitted_at": "2026-08-01T10:12:00.000Z"
      }
    ],
    "total": 1,
    "limit": 100,
    "filters": { "courseId": null, "testId": null, "date": null }
  }
}
```

| Field | Meaning |
|-------|---------|
| `rank` | 1-based position after sort |
| `student_name` | `profiles.full_name` |
| `score` | `obtained_marks` |
| `percentage` | Stored score % |
| `time_taken_seconds` | `submitted_at − started_at` |

---

## Ranking rules (server)

1. Source rows: `test_attempts` with `status ∈ {submitted, expired}` and `obtained_marks` set  
2. Apply filters (`testId` / course’s published test IDs / `date` on `submitted_at`)  
3. Keep **best attempt per `user_id`**: higher `%`, then higher score, then **shorter** time  
4. Sort the same way globally → assign ranks → slice to `limit` (max 100)  
5. Enrich names from `profiles`, titles from `tests`

Uses **service role** (`getSupabaseAdmin`) so students can read the public ranking despite RLS (own-attempts-only).

---

## Architecture

```
Mobile LeaderboardScreen
   │  filters: courseId · testId · date
   ▼
GET /student/leaderboard
   ▼
leaderboard.service.getLeaderboard
   · filter attempts
   · best-per-user
   · rank + enrich names
   ▼
LeaderboardPage { items[≤100] }
```

Supporting lists for filter chips:

- Courses → existing `GET /courses`
- Tests → existing `GET /student/tests?courseId=`

---

## Mobile entry

**Profile → Leaderboard**

Docs index: see `docs/README.md`.
