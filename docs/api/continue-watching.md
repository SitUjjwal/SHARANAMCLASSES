# Continue Watching

Resume in-progress video lessons from the last playback position.

## Flow

```
VideoPlayer (YouTube embed)
  │  every 15s while playing (+ on pause/end)
  │  player.getCurrentTime() / getDuration()
  ▼
PUT /videos/:videoId/progress
  { course_id, chapter_id, position_seconds, duration_seconds }
  ▼
Supabase video_watch_progress (upsert)
  + enroll enrollment last_watched_* (Learning Progress sync)
  ▼
GET /dashboard → continue_watching
  ▼
Home Continue button → VideoPlayer (initialPlayerParams.start = position)
```

## Rules

| Condition | Behavior |
|-----------|----------|
| `position < 5s` | Not shown as Continue Watching |
| `position ≥ 95% of duration` | Marked `completed`; removed from Continue |
| Otherwise | Eligible; Home shows most recently updated row |

## API

| Method | Path | Notes |
|--------|------|-------|
| `PUT` | `/videos/:videoId/progress` | Upsert position (auth) |
| `GET` | `/videos/:videoId/progress` | Restore for player |
| `GET` | `/continue-watching` | Standalone continue payload |
| `GET` | `/dashboard` | Includes `continue_watching` |

## Mobile

- `YouTubeEmbed` polls every **15 seconds** via `getCurrentTime`
- Resume uses `initialPlayerParams.start`
- Poster CTA becomes **Continue from m:ss** when a saved position exists
- Home shows `ContinueWatchingCard` under the greeting when `continue_watching` is set

## Migration

`infra/supabase/migrations/20260802200000_video_watch_progress.sql`
