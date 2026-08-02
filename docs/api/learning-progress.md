# Learning Progress

Student learning progress across enrolled courses (`GET /progress`; alias `GET /learning-progress`).

## What the screen shows

| UI | Source |
|----|--------|
| Completed Chapters | Sum of completed chapters across enrollments |
| Remaining Chapters | Sum of remaining chapters |
| Overall Course Percentage | Progress bar + large % |
| Continue Learning | Most recently watched chapter |
| Last Watched Video | First published video on that chapter (else chapter title) |
| Per-course Progress Bar | `progress_percent` for each course |

## Calculation

### Per course

1. `total_chapters` = count of **published** chapters for the course (ordered by `sort_order`).
2. **If** `enrollments.last_watched_chapter_id` is set and found in that list:
   - `completed_chapters` = index of that chapter **+ 1**  
     (all chapters up through the last watched one count as completed/visited)
3. **Else** (never opened a chapter, or chapter missing):
   - `completed_chapters` = `round(total_chapters × enrollments.progress_percent / 100)`
4. If stored `progress_percent >= 100` → `completed_chapters = total_chapters`
5. `remaining_chapters` = `total_chapters − completed_chapters`
6. `progress_percent` (display) = `round(100 × completed / total)` (0 if no chapters)

### Overall (hub summary)

```
overall_percentage = round(100 × Σ completed_chapters / Σ total_chapters)
```

Weighted by chapter count (a long course affects the overall % more than a short one).

`average_progress` is kept as an alias of `overall_percentage` for older clients.

### Continue Learning / Last Watched Video

- Continue target = enrollment with the most recent `last_watched_at` that has a chapter id.
- Video title = first published `videos` row for that chapter (`sort_order` ascending).
- Mobile **Continue** opens `ChapterContent` for that course + chapter.

## Example

Course has chapters A, B, C, D (4 total). Student last opened **B** (index 1):

- completed = 2 (A, B)
- remaining = 2 (C, D)
- course % = 50%

Two courses: (2/4) and (3/3) → overall = `round(100 × 5/7)` = **71%**.

## API

`GET /learning-progress` (auth) → `LearningProgressSummary`

Cache key (mobile): `['profile', 'learning-progress']` — invalidated when a chapter is opened (`updateLastWatchedChapter`).
