# Request Validation Architecture

Zod validation for `@sharanam/api`.

## Architecture

```
HTTP request
    │
    ▼
┌──────────────────────────────┐
│ Auth / rate limit / sanitize │  (earlier middleware)
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ validate(schema, target?)    │  body | query | params
│  — or —                      │
│ validateRequest({            │  params → query → body (in order)
│   params, query, body        │
│ })                           │
└──────────────┬───────────────┘
               │ fail
               ▼
┌──────────────────────────────┐
│ AppError 400 VALIDATION_ERROR│
│ details: structured Zod map  │
└──────────────┬───────────────┘
               │ ok
               ▼
         Controller (typed parsed data)
```

### Middleware

| Export | File | Role |
|--------|------|------|
| `validate(schema, target?)` | `middlewares/validate.ts` | Single slice |
| `validateRequest({…})` | same | Multi-slice |
| `formatZodError` | `utils/zodErrors.ts` | Stable `details` payload |
| `errorHandler` | `middlewares/errorHandler.ts` | Also formats raw `ZodError` |

### Structured error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email: Enter a valid email",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "email": ["Enter a valid email"]
      },
      "issues": [
        { "path": "email", "message": "Enter a valid email", "code": "invalid_string" }
      ]
    },
    "request_id": "…"
  }
}
```

## Domain coverage

| Domain | Schemas | Wired on |
|--------|---------|----------|
| **Register / Login** | `auth.validators.ts` | `POST /auth/validate/register`, `/login`, `/forgot-password`, `/reset-password` |
| **Payments** | `payment.validators.ts` | create-order, verify, history query, receipt params, admin list/export |
| **Courses** | `course.validators.ts` | list query, create/update body, `:id` params |
| **Videos** | `video.validators.ts` | list, create/update, progress, `:id` / `:videoId` |
| **Live Classes** | `liveClass.validators.ts` | list/public query, create/update/notify, `:id` |
| **Tests** | `test.validators.ts` | admin list/CRUD, student list query, `:id` |
| **Feedback** | `feedback.validators.ts` | create/update, student+admin list query, `:feedbackId` |
| **Settings** | `systemSettings.validators.ts` | PUT full + PATCH partial `/settings` |

Shared helpers: `validators/common.validators.ts` (`uuidIdParamSchema`, pagination, named UUID params).

## Auth note

Mobile still signs up / signs in via **Supabase client**. The `/auth/validate/*` endpoints enforce the same rules server-side (rate-limited) so clients can get consistent `VALIDATION_ERROR` JSON before calling Supabase. Password change remains `PUT /change-password` with `changePasswordSchema`.

## Usage examples

```ts
import { validate, validateRequest } from '../middlewares/validate';
import { createCourseSchema } from '../validators/course.validators';
import { uuidIdParamSchema } from '../validators/common.validators';

router.post('/courses', requireAuth, validate(createCourseSchema), postCourse);

router.put(
  '/courses/:id',
  requireAuth,
  validateRequest({ params: uuidIdParamSchema, body: updateCourseSchema }),
  patchCourse,
);
```
