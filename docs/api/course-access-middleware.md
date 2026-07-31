# Course access middleware

Protects student content APIs so **paid media URLs are never leaked** without purchase/enrollment.

---

## Rule

| Condition | Mode | Videos / PDFs / Notes |
|-----------|------|------------------------|
| User purchased **or** enrolled | `full` | All items unlocked (URLs returned) |
| Otherwise | `preview` | Only `is_free` items unlocked; paid items `is_locked: true`, URL `null` |

Chapter list uses the same idea: unlocked if enrolled/purchased **or** `chapter.is_free_preview`.

---

## Architecture

```
Client  Authorization: Bearer <token>
   │
   ▼
requireAuth                    → req.user
   │
   ▼
attachCourseAccessFromCourse   → req.courseAccess  (from :id / :courseId)
   or
attachCourseAccessFromChapter  → req.courseAccess  (chapter → course_id)
   │
   │  hasFullAccess = enrollments OR purchased_courses
   │  mode = 'full' | 'preview'
   ▼
Controller → service list*Public({ enrolled: hasFullAccess })
   │
   ▼
isMediaLocked(hasFullAccess, is_free)
   → strip youtube_url / file_url / notes_url when locked
```

**Files**

| Layer | Path |
|-------|------|
| Middleware | `apps/api/src/middlewares/courseAccess.ts` |
| Access service | `apps/api/src/services/courseAccess.service.ts` |
| Lock helper | `isMediaLocked()` used by video/pdf/note services |
| Routes | `apps/api/src/routes/course.routes.ts` |

---

## Protected routes

All require `requireAuth` **and** course-access middleware:

| Method | Path | Middleware |
|--------|------|------------|
| `GET` | `/courses/:id/content` | `attachCourseAccessFromCourse` |
| `GET` | `/courses/:id/chapters` | `attachCourseAccessFromCourse` |
| `GET` | `/courses/:id/chapters/:chapterId` | `attachCourseAccessFromCourse` |
| `GET` | `/chapters/:id/videos` | `attachCourseAccessFromChapter` |
| `GET` | `/chapters/:id/pdfs` | `attachCourseAccessFromChapter` |
| `GET` | `/chapters/:id/notes` | `attachCourseAccessFromChapter` |

Optional hard gate (403, no preview): `requireFullCourseAccess` after attach — not used on the preview-friendly list routes above.

---

## Why middleware (not only service checks)?

1. **One place** — purchase/enrollment resolved once per request on `req.courseAccess`.
2. **Protect by default** — student content routes must declare the middleware; missing it fails loudly in handlers.
3. **Clear contract** — controllers always know `mode: full | preview` before listing media.
4. **Safe URLs** — services never return paid YouTube/PDF/notes URLs when `mode === preview`.

---

## Example: videos

**Purchased** → every published video includes `youtube_url`.

**Not purchased** → free preview videos include `youtube_url`; paid videos return `is_locked: true`, `youtube_url: null`.
