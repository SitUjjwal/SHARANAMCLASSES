# Course Ratings & Reviews

Students rate enrolled courses **1–5 stars**, write a review, and can edit or delete their single review per course. **Admin approval** is required before a review is public or counts toward the course average.

## Architecture

```
Student enrolled in course
        │
        ▼
  POST /reviews  (rating + comment)
        │
        ▼
  course_reviews  status = pending_approval
        │
        ▼
  Admin Approves  (POST /admin/reviews/:id/approve)
        │
        ├─ status = approved
        └─ recalculate courses.rating + courses.review_count
        │
        ▼
  Course detail / cards show average + public reviews
```

## Rules

| Rule | Behavior |
|------|----------|
| One review per course | Unique `(user_id, course_id)` — create returns `409 REVIEW_EXISTS` |
| Enrollment required | Must be in `enrollments` or create returns `403 NOT_ENROLLED` |
| Rating | Integer 1–5 |
| Comment | 10–2000 characters |
| Public display | Only `approved` reviews |
| Edit | Own review only → status resets to `pending_approval` (re-approval) |
| Delete | Own review only; if it was approved, average recalculates |
| Average | Mean of approved ratings, rounded to 1 decimal; `0` when none |

## Status machine

| Status | Meaning |
|--------|---------|
| `pending_approval` | Submitted / edited; waiting for admin |
| `approved` | Public; included in average |
| `rejected` | Hidden; student may edit and resubmit |

## Student APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/courses/:courseId/reviews` | Required | Approved list + `average_rating` + `review_count` + `my_review` |
| `GET` | `/reviews/:courseId` | Required | **Alias** of `/courses/:courseId/reviews` |
| `GET` | `/reviews/mine?course_id=` | Required | Current user’s review for a course (any status) |
| `POST` | `/reviews` | Required | Create `{ course_id, rating, comment }` → `201` |
| `PATCH` | `/reviews/:reviewId` | Required | Update own `{ rating?, comment? }` → pending again |
| `PUT` | `/reviews/:id` | Required | **Alias** of PATCH |
| `DELETE` | `/reviews/:id` | Required | Delete own review |

### `GET /courses/:courseId/reviews` response

```json
{
  "success": true,
  "data": {
    "course_id": "uuid",
    "average_rating": 4.5,
    "review_count": 12,
    "items": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Clear teaching…",
        "author_name": "Riya",
        "created_at": "2026-08-01T10:00:00.000Z"
      }
    ],
    "my_review": {
      "id": "uuid",
      "course_id": "uuid",
      "user_id": "uuid",
      "rating": 4,
      "comment": "Good pace",
      "status": "pending_approval",
      "author_name": "You",
      "rejection_reason": null,
      "is_testimonial": false,
      "created_at": "…",
      "updated_at": "…",
      "approved_at": null
    }
  }
}
```

`my_review` is `null` when the user has not reviewed this course.

### `POST /reviews` body

```json
{
  "course_id": "uuid",
  "rating": 5,
  "comment": "Loved the chapter videos and notes."
}
```

## Admin APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/reviews?status=&course_id=` | Admin | Filter by `pending_approval` \| `approved` \| `rejected` |
| `POST` | `/admin/reviews/:reviewId/approve` | Admin | Publish + recalculate average |
| `POST` | `/admin/reviews/:reviewId/reject` | Admin | Body `{ "reason": "optional" }` · clears testimonial flag |
| `PATCH` | `/admin/reviews/:reviewId/testimonial` | Admin | Body `{ "is_testimonial": true\|false }` · approved only |
| `GET` | `/admin/testimonials` | Admin | Approved reviews with `is_testimonial=true` |

Admin UI: **Reviews** (`/reviews`) — Approve / Reject / Feature. **Testimonials** (`/testimonials`) — feature/unfeature.

## Catalog average

`CourseSummary.rating` and optional `review_count` come from denormalized columns on `courses`, updated whenever an approved review is added, edited (demoted), rejected, or deleted.

## Migration

Apply on Supabase:

1. `infra/supabase/migrations/20260802220000_course_reviews.sql`
2. `infra/supabase/migrations/20260802280000_course_review_testimonials.sql` (`is_testimonial`)

Creates `course_reviews`, adds `courses.review_count`, RLS deny-all (API service role only).

## Mobile

- Course detail → **Ratings & reviews** + Write / Edit review
- `AppReview` stack screen (`modules/feedback`) — create / edit / delete
- Drawer **Rate** opens review only with a `courseId` from course detail (hub explains otherwise)

## Error codes

| Code | HTTP | When |
|------|------|------|
| `NOT_ENROLLED` | 403 | Not enrolled |
| `REVIEW_EXISTS` | 409 | Second create for same course |
| `REVIEW_NOT_FOUND` | 404 | Unknown id |
| `FORBIDDEN` | 403 | Edit/delete someone else’s review |
| `COURSE_NOT_FOUND` | 404 | Unpublished / missing course |
| `REVIEW_NOT_APPROVED` | 400 | Feature unapproved review as testimonial |