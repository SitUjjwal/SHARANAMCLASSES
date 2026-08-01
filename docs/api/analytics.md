# Test Analytics Dashboard

Base URL: `http://localhost:4000`  
Auth: `Authorization: Bearer <supabase_access_token>`

---

## Architecture

```
Profile → Analytics
            │
            ▼
GET /student/analytics   (requireAuth)
            │
            ▼
analytics.service.getStudentTestAnalytics(userId)
   · Load scored attempts (submitted | expired)
   · Join tests → courses
   · Subject = courses.subject || courses.title || "General"
   · Aggregate summary + strong/weak + recent + charts
            ▼
StudentTestAnalytics
            ▼
AnalyticsDashboardScreen
   · AnalyticsSummaryCards
   · SubjectStrengthList (strong / weak)
   · ScoreTrendChart · SubjectBarsChart
   · RecentActivityList → TestResult
```

**Subject rule:** prefer `courses.subject`, else course title, else `"General"` for unlinked mocks.

---

## Backend API

### `GET /student/analytics`

One round-trip for the signed-in student’s Test Series performance.

**Response**

```json
{
  "success": true,
  "data": {
    "summary": {
      "average_score": 72.5,
      "total_tests": 4,
      "total_attempts": 7,
      "pass_percentage": 57.1
    },
    "strong_subjects": [
      { "subject": "Mathematics", "average_percentage": 88, "attempts": 3, "pass_percent": 100 }
    ],
    "weak_subjects": [
      { "subject": "Physics", "average_percentage": 41, "attempts": 2, "pass_percent": 0 }
    ],
    "recent_activity": [
      {
        "attempt_id": "…",
        "test_id": "…",
        "test_title": "Algebra Mock",
        "subject": "Mathematics",
        "percentage": 80,
        "obtained_marks": 40,
        "is_passed": true,
        "submitted_at": "2026-08-01T10:00:00.000Z"
      }
    ],
    "charts": {
      "score_over_time": [
        { "date": "2026-07-28", "average_percentage": 70, "attempts": 1 }
      ],
      "by_subject": [
        { "subject": "Mathematics", "average_percentage": 88, "attempts": 3, "pass_percent": 100 }
      ]
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `average_score` | Mean of attempt `percentage` |
| `total_tests` | Distinct `test_id` count |
| `total_attempts` | Scored attempt count |
| `pass_percentage` | `%` of attempts with `is_passed` |
| `strong_subjects` | Top 3 by avg % |
| `weak_subjects` | Bottom 3 by avg % |
| `charts.score_over_time` | Last 14 days with data |
| `charts.by_subject` | All subjects for bar chart |

---

## Mobile components

| Component | Role |
|-----------|------|
| **AnalyticsDashboardScreen** | Orchestrator + pull-to-refresh |
| **AnalyticsSummaryCards** | Average · Total tests · Pass % |
| **SubjectStrengthList** | Strong / weak subject lists |
| **ScoreTrendChart** | Daily avg % bars |
| **SubjectBarsChart** | Horizontal subject bars |
| **RecentActivityList** | Latest attempts → Result Screen |

---

## Entry

**Profile → Analytics**

Requires prior scored attempts (submit / auto-submit).
