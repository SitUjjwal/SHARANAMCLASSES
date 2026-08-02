# Feedback & Support — Testing Checklist

Manual QA checklist for Reviews, Feedback, Bugs, FAQ, Support, and related admin surfaces.

**Prereqs:** apply migrations through `20260802280000_course_review_testimonials.sql`, restart API, rebuild `@sharanam/shared`, run admin + mobile against the same API.

---

## Reviews

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| R1 | Students can submit reviews | Enrolled student → course detail / AppReview → rating + comment ≥10 chars → `POST /reviews` | ☐ |
| R2 | One review per course | Second `POST /reviews` same course → `409 REVIEW_EXISTS` | ☐ |
| R3 | Admin approval required | New review `status=pending_approval`; not in public list / average until Approve | ☐ |
| R4 | Average rating updates | Approve → `courses.rating` + `review_count` update; reject/delete approved recalculates | ☐ |
| R5 | Edit resets approval | Student `PUT/PATCH /reviews/:id` → back to `pending_approval` | ☐ |
| R6 | Testimonials | Approved review → Feature on `/testimonials` → `is_testimonial=true` | ☐ |

## Feedback

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| F1 | Ticket created | Mobile Submit feedback → ticket `FBYYYY#####`, status `open` | ☐ |
| F2 | Admin reply displayed | Admin Resolve/Close with note → student detail shows **Admin reply** (`admin_note`) | ☐ |
| F3 | Status updates | Admin Start / Resolve / Close / Reopen → mobile timeline matches | ☐ |
| F4 | Feature requests | Type `suggestion` appears under Feedback + Feedback Hub feature_requests | ☐ |
| F5 | Student edit (open) | Detail → Edit title/message → `PATCH /feedback/:id` | ☐ |
| F6 | Student delete (open) | Detail → Delete → `DELETE /feedback/:id` · gone from My feedback | ☐ |
| F7 | Admin delete | Feedback page → Delete → ticket removed | ☐ |
| F8 | Edit blocked after Start | `in_progress` ticket → edit/delete returns `FEEDBACK_NOT_EDITABLE` / `NOT_DELETABLE` | ☐ |

> Feedback tickets use a single **admin reply** field (`admin_note`), not a chat thread. Live chat replies are under **Support**.

## Bug Reports

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| B1 | Screenshot uploads | `POST /bug-report` multipart with JPEG/PNG/WebP → `screenshot_url` set | ☐ |
| B2 | Status changes | Admin Start / Resolve / Close / Reopen | ☐ |
| B3 | Reports searchable | Admin Bug Reports search box filters ticket, student, screen, description | ☐ |

## FAQ

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| Q1 | Search works | Mobile `GET /faq?q=` / `GET /faqs?q=` filters Q&A | ☐ |
| Q2 | CRUD works | Admin create / edit / delete / reorder / publish toggle | ☐ |

## Support

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| S1 | Messages send | Student `POST /support/message` → message in thread | ☐ |
| S2 | Admin replies appear | Admin Chat Support reply → student poll/history shows bubble | ☐ |
| S3 | Conversation history loads | `GET /support/history` returns conversation + messages | ☐ |

## Content Reports (related)

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| C1 | Submit report | `POST /report-content` with type + description | ☐ |
| C2 | Admin triage | Content Reports page status actions | ☐ |

## Code / Docs

| # | Case | How to verify | Pass |
|---|------|---------------|------|
| X1 | No TypeScript errors | `npm run build --workspace=@sharanam/shared` then `tsc --noEmit` on api, admin, mobile | ✅ Verified |
| X2 | No ESLint errors | `npm run lint` on `@sharanam/api`, `@sharanam/admin`, `@sharanam/shared` | ✅ Verified |
| X3 | API docs updated | See index below (+ edit/delete in `student-feedback.md`) | ✅ |

---

## API documentation index

| Topic | Doc |
|-------|-----|
| Spec path map + aliases | [`feedback-support-apis.md`](./feedback-support-apis.md) |
| Course reviews | [`course-reviews.md`](./course-reviews.md) |
| Student feedback tickets | [`student-feedback.md`](./student-feedback.md) |
| Bug reports | [`bug-reports.md`](./bug-reports.md) |
| FAQs | [`faqs.md`](./faqs.md) |
| Support chat | [`support-chat.md`](./support-chat.md) |
| Content reports | [`content-reports.md`](./content-reports.md) |
| Admin feedback hub | [`feedback-dashboard.md`](./feedback-dashboard.md) |
| Contact us | [`contact-us.md`](./contact-us.md) |

## Migrations (order)

1. `20260802220000_course_reviews.sql`
2. `20260802230000_student_feedback.sql`
3. `20260802240000_bug_reports.sql`
4. `20260802250000_faqs.sql`
5. `20260802260000_support_chat.sql`
6. `20260802270000_content_reports.sql`
7. `20260802280000_course_review_testimonials.sql`
