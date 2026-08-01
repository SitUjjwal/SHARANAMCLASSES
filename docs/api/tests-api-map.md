# Test Series — canonical API map

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

---

## Your requested surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/tests` | Admin | Paginated catalog |
| `GET` | `/tests/:id` | Admin | Single test |
| `GET` | `/tests/:id/questions` | Admin | MCQ bank (includes answers) |
| `POST` | `/tests` | Admin | Create test |
| `PUT` | `/tests/:id` | Admin | Update test |
| `DELETE` | `/tests/:id` | Admin | Delete test (+ cascade questions) |
| `POST` | `/submit-test` | Student | Score + lock attempt |
| `GET` | `/results` | Student | Your scored attempts (paginated) |
| `GET` | `/results/:id` | Student | Full result + review |
| `GET` | `/leaderboard` | Student | Top 100 |

Admin also: `POST /tests/:id/questions`, Excel import, `PUT|DELETE /questions/:id`.

---

## Details

### Admin CRUD (already on these paths)

```
GET    /tests?search&courseId&page&pageSize
GET    /tests/:id
POST   /tests
PUT    /tests/:id
DELETE /tests/:id
GET    /tests/:id/questions     ← same as /tests/:testId/questions
```

Student list (no answers): `GET /student/tests` · `GET /student/tests/:testId/questions`  
Start attempt: `POST /student/tests/:testId/attempts`

### `POST /submit-test`

```json
{ "attempt_id": "uuid", "reason": "manual" }
```

`reason`: `manual` | `auto` (default `manual`).  
Returns `TestAttemptResult` (summary + review).  
Alias of `POST /student/attempts/:attemptId/submit`.

### `GET /results`

| Query | Default |
|-------|---------|
| `page` | `1` |
| `pageSize` | `20` (max 50) |

Returns `{ items: TestAttemptResultSummary[], page, pageSize, total, hasMore }`.

### `GET /results/:id`

Full `TestAttemptResult` for one attempt (must be submitted/expired).  
Alias of `GET /student/attempts/:attemptId/result`.

### `GET /leaderboard`

Query: `courseId`, `testId`, `date` (`YYYY-MM-DD`), `limit` (≤100).  
Alias of `GET /student/leaderboard`.

---

## Related docs

- [tests.md](./tests.md) — admin test CRUD  
- [questions.md](./questions.md) — question bank  
- [test-results.md](./test-results.md) — scoring  
- [leaderboard.md](./leaderboard.md) — ranking rules  
- [analytics.md](./analytics.md) — `GET /student/analytics`
