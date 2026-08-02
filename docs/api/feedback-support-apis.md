# Feedback & Support — Student Backend APIs

Canonical production paths plus **spec aliases** (same handlers).

Auth: Bearer token on all routes below.

## Reviews

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| Create | `POST` | `/reviews` | Body: `{ course_id, rating, comment }` |
| List by course | `GET` | `/reviews/:courseId` | Alias of `/courses/:courseId/reviews` |
| Update | `PUT` | `/reviews/:id` | Alias of `PATCH /reviews/:reviewId` |
| Delete | `DELETE` | `/reviews/:id` | Also `/reviews/:reviewId` |

Also: `GET /reviews/mine?course_id=` · Admin approve/reject/testimonial under `/admin/reviews/…` · `GET /admin/testimonials`

## Feedback tickets

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| Create | `POST` | `/feedback` | Types: general, course, teacher, suggestion, complaint |
| List mine | `GET` | `/feedback` | Newest first |

Also: `GET /feedback/:feedbackId` · `GET /feedback/teachers`

## Bug reports

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| Create | `POST` | `/bug-report` | Alias of `/bug-reports` (multipart: description, screen_key, screenshot?) |

Also: `GET /bug-reports` · `GET /bug-reports/:reportId`

## FAQ

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| List | `GET` | `/faq` | Alias of `/faqs?q=` |

## Support chat

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| Send message | `POST` | `/support/message` | Alias of `/support/chat/messages` · Body `{ body }` |
| History | `GET` | `/support/history` | Alias of `/support/chat` · thread + messages |

## Content reports

| Spec | Method | Path | Notes |
|------|--------|------|-------|
| Submit | `POST` | `/report-content` | Alias of `/content-reports` |

Body: `{ report_type, description, target_type?, target_id?, course_id?, chapter_id?, target_label? }`

## Example bodies

```http
POST /reviews
{ "course_id": "uuid", "rating": 5, "comment": "Clear explanations and good pace." }
```

```http
PUT /reviews/:id
{ "rating": 4, "comment": "Updated after finishing the course." }
```

```http
POST /feedback
{ "feedback_type": "suggestion", "title": "Dark mode", "message": "Please add a dark theme option." }
```

```http
POST /bug-report
Content-Type: multipart/form-data
description=Video freezes after seek&screen_key=video_player&screenshot=<file>
```

```http
POST /support/message
{ "body": "I cannot open yesterday’s PDF." }
```

```http
POST /report-content
{
  "report_type": "incorrect_video",
  "description": "This lecture is for the wrong class.",
  "target_type": "video",
  "target_id": "uuid",
  "course_id": "uuid",
  "chapter_id": "uuid",
  "target_label": "Newton’s Laws — Part 2"
}
```

## Related docs

- `course-reviews.md` · `student-feedback.md` · `bug-reports.md` · `faqs.md` · `support-chat.md` · `content-reports.md` · `feedback-dashboard.md`
- **QA:** `testing-checklist-feedback.md`
