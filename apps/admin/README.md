# @sharanam/admin

React + Vite admin panel for SHARANAM CLASSES.

## REST API (primary)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/courses` | User | List courses (admin sees all + filters; student sees published) |
| `POST` | `/courses` | Admin | Create course |
| `PUT` | `/courses/:id` | Admin | Update course |
| `DELETE` | `/courses/:id` | Admin | Delete course |
| `GET` | `/chapters?courseId=` | Admin | List chapters for a course |
| `POST` | `/chapters` | Admin | Create chapter (`course_id` in body) |
| `PUT` | `/chapters/:id` | Admin | Update chapter |
| `DELETE` | `/chapters/:id` | Admin | Delete chapter |
| `GET` | `/categories` | User | List categories (admin: all; student: active) |
| `POST` | `/categories` | Admin | Create category |

Extra helpers: `POST /courses/upload-thumbnail`, `PUT /chapters/reorder`, student `GET /courses/:id`, enroll, nested chapter content.

## Course Management

`/courses` supports:

- Create / Update / Delete
- Thumbnail upload (Supabase Storage `course-thumbnails`)
- Assign teacher + category
- Price + Free/Paid
- Active/Inactive (`is_published`)
- Search + pagination + validation

### Controllers (API)

Controllers live in `apps/api/src/controllers/course.controller.ts`. They only:

1. Read auth user / route params / validated body  
2. Call a **service** (DB / Storage)  
3. Return JSON `{ success, data }`

| Controller | Route | Job |
|---|---|---|
| `listAdminCourses` | `GET /admin/courses` | Paginated admin list |
| `getAdminCourse` | `GET /admin/courses/:id` | Single course |
| `postCourse` | `POST /admin/courses` | Create |
| `patchCourse` | `PATCH /admin/courses/:id` | Update |
| `removeCourse` | `DELETE /admin/courses/:id` | Delete |
| `postCourseThumbnail` | `POST /admin/courses/upload-thumbnail` | Upload image |

Zod validation runs in middleware **before** controllers (`validate(createCourseSchema)`).

## Chapter Management

`/chapters` supports:

- Add / Edit / Delete chapter
- Search within a course
- Drag-and-drop ordering (saved via reorder API)

### Every Chapter API

| Method | Route | Who | What it does |
|---|---|---|---|
| `GET` | `/courses/:courseId/chapters` | Student | Published chapters only (+ lock flags) |
| `GET` | `/courses/:courseId/chapters/:chapterId` | Student | Chapter content (videos/PDFs/notes); empty if locked |
| `GET` | `/admin/courses/:courseId/chapters?search=` | Admin | All chapters for a course (incl. drafts); optional title/description search |
| `POST` | `/admin/courses/:courseId/chapters` | Admin | **Add chapter** (title, counts, free preview, published, …) |
| `PATCH` | `/admin/chapters/:chapterId` | Admin | **Edit chapter** (partial update) |
| `DELETE` | `/admin/chapters/:chapterId` | Admin | **Delete chapter** (+ cascaded contents) |
| `PUT` | `/admin/courses/:courseId/chapters/reorder` | Admin | **Change order** — body `{ orderedIds: string[] }` (full id list in new order) |

Controllers: `apps/api/src/controllers/chapter.controller.ts`  
Services: `apps/api/src/services/chapter.service.ts`

### Setup

1. Copy `.env.example` → `.env` and set Supabase URL + anon key + API URL  
2. Run SQL `infra/supabase/migrations/20260731120000_course_thumbnails_bucket.sql`  
3. Set `profiles.role = 'admin'` for your user  
4. `npm run dev:admin` → http://localhost:5173/login  

## Menu

| Item | Route |
|---|---|
| Dashboard | `/` |
| Courses | `/courses` |
| Categories | `/categories` |
| Chapters | `/chapters` |
| Teachers | `/teachers` |
| Students | `/students` |
| Payments | `/payments` |
