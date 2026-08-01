# Test Series — testing checklist

Use after applying migrations through `20260802050000_leaderboard_indexes.sql` and restarting `apps/api`.

Legend: **Auto** = tooling / unit tests · **Manual** = smoke in Admin or Mobile

Mark each row ✅ when verified.

---

## Prerequisites

- [ ] Migrations applied: tests, questions, attempts, results, leaderboard indexes
- [ ] `apps/api` running on `:4000`
- [ ] Admin logged in as admin (`profiles.role = admin` or `ADMIN_EMAILS`)
- [ ] Mobile logged in as student
- [ ] At least one published course (for subject analytics) and one published test with questions

---

## Admin

| Check | How | Status |
|-------|-----|--------|
| Create test | Admin → **Tests** → Add → save published | Manual |
| Edit test | Open test → change duration/marks → save | Manual |
| Delete test | Delete test → confirm cascade of questions | Manual |
| Add questions | **Questions** → Manage questions → Add MCQ (A–D, marks) | Manual |
| Import Excel questions | Import `.xlsx` with headers `question_text`, `option_a`–`d`, `correct_answer` | Manual |

Menu paths: Dashboard · Courses · Tests · Questions · Results · Leaderboard · Analytics

---

## Student

| Check | How | Status |
|-------|-----|--------|
| Timer works | Profile → Test Series → Start → countdown ticks; **Paused** when app backgrounds | Manual |
| Auto-save answers | Select option → header shows Saving… / Saved; reopen attempt still has answer | Manual |
| Auto-submit at timeout | Use short-duration test (1 min) or wait → redirects to Result | Manual |
| Results calculate correctly | Compare obtained / % / pass to marks & negative marks | Manual |
| Review answers works | Result → Review Answers → selected (green/red) + correct + explanation | Manual |

Related APIs: `POST /submit-test`, `GET /results/:id`, attempt auto-save `PUT …/answers`

---

## Analytics

| Check | How | Status |
|-------|-----|--------|
| Leaderboard updates | Complete a test → Profile **Leaderboard** / Admin **Leaderboard** shows rank | Manual |
| Student statistics display | Profile → **Analytics** → avg score, total tests, pass % | Manual |
| Performance charts render | Analytics → score-over-time bars + by-subject bars | Manual |

Admin: **Results** lists all students; **Analytics** shows platform aggregates (`GET /admin/results`, `GET /admin/analytics`).

---

## Code

| Check | How | Status |
|-------|-----|--------|
| No TypeScript errors | `npm run typecheck` in `apps/api`, `apps/admin`, `apps/mobile` | Auto ✅ (2026-08-02) |
| No ESLint errors | `npm run lint` in same packages | Auto ✅ (2026-08-02 · 0 errors) |
| API documentation updated | See docs list below | Auto ✅ |

### Docs covering this module

| Doc | Path |
|-----|------|
| Canonical API map | `docs/api/tests-api-map.md` |
| Tests CRUD | `docs/api/tests.md` |
| Questions | `docs/api/questions.md` |
| Test screen / auto-save | `docs/api/test-screen.md` |
| Timer | `docs/api/timer.md` |
| Results | `docs/api/test-results.md` |
| Review | `docs/api/test-review.md` |
| Leaderboard | `docs/api/leaderboard.md` |
| Analytics | `docs/api/analytics.md` |

Unit validators (API): `npx vitest run tests/tests` — ✅ 20/20 pass (`question` / `attempt` / `leaderboard` / `test` validators).

---

## Quick smoke sequence

1. Admin: create published test → add 3 questions (or Excel import)  
2. Mobile: Start test → answer 2 → leave one blank → mark one for review  
3. Wait for timer **or** tap Submit → Result shows scores  
4. Review Answers → colors correct  
5. Leaderboard + Analytics refresh → your attempt appears  
6. Admin Results / Analytics reflect the same attempt  
