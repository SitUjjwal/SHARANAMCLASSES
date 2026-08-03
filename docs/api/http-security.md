# HTTP Security Middleware Stack



Production security for `@sharanam/api` (Express).



## Middleware order (`createApp`)



| # | Middleware | File | What it does |

|---|------------|------|----------------|

| 1 | **trust proxy** | `app.ts` | Trust `X-Forwarded-*` from one hop (nginx/Cloudflare) so rate limits + HTTPS checks see the real client. |

| 2 | **disable x-powered-by** | `app.ts` | Hides `X-Powered-By: Express` fingerprint. |

| 3 | **requestId** | `middlewares/requestId.ts` | Sets `X-Request-Id` (or accepts a safe client id) for log correlation; echoed in error JSON. |

| 4 | **Helmet** | `middlewares/secureHeaders.ts` | Sets secure headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, HSTS (prod), etc. CSP disabled because this is a JSON API, not an HTML site. |

| 5 | **extraSecureHeaders** | same | Adds `Permissions-Policy`, `Cache-Control: no-store` (prod), cross-domain policy denial. |

| 6 | **enforceHttps** | `middlewares/enforceHttps.ts` | In production, rejects requests whose `X-Forwarded-Proto` is not `https`. |

| 7 | **compression** | `app.ts` | Gzip responses above 1KB; skip when client sends `x-no-compression`. |

| 8 | **CORS whitelist** | `middlewares/cors.ts` | Only origins in `CORS_ORIGINS`. No-Origin allowed (mobile). Others → `403 CORS_FORBIDDEN`. Credentials enabled for admin cookie/session flows. |

| 9 | **morgan** | `app.ts` | Access logs (`combined` in prod, `dev` locally). |

| 10 | **express.json (1mb)** | `app.ts` | Parses JSON only; hard size cap prevents payload DoS. |

| 11 | **urlencoded (100kb)** | `app.ts` | `extended: false` avoids qs prototype-pollution class issues; low parameter limit. |

| 12 | **cookieParser** | `app.ts` | Parses cookies if present (auth still uses Bearer JWT). |

| 13 | **sanitizeRequestBody** | `middlewares/sanitizeBody.ts` | Strips HTML tags / `javascript:` / inline event handlers from string fields (**XSS protection** on write). |

| 14 | **rateLimiter** | `middlewares/rateLimiter.ts` | Global request budget per IP; skips `/health`. Stricter `authRateLimiter` on `/auth/staff-context`. |

| 15 | **maintenanceModeGuard** | `middlewares/maintenanceMode.ts` | Returns `503 MAINTENANCE` for non-staff when enabled. |

| 16 | **routes** | `routes/` | Domain routers; many mutations use Zod `validate()` + `requireAuth` / `requirePermission`. |

| 17 | **notFoundHandler** | `middlewares/notFoundHandler.ts` | Consistent `404 NOT_FOUND` JSON. |

| 18 | **errorHandler** | `middlewares/errorHandler.ts` | Always `{ success: false, error: { code, message, details?, request_id? } }` for AppError, Zod, Multer, CORS, 429, and unknown 500s (message sanitized in prod). |



## JWT verification (`requireAuth`)



File: `middlewares/auth.ts`



1. Require `Authorization: Bearer <token>`

2. Reject oversized / malformed JWT shapes (not 3 base64url parts)

3. Verify with **Supabase** `auth.getUser(jwt)` (signature, expiry, user still exists)

4. Reject banned users

5. Attach `req.user` + `req.accessToken`



Do **not** trust a locally decoded payload alone.



## Input validation



- Route bodies/queries/params: Zod via `middlewares/validate.ts` → `400 VALIDATION_ERROR`

- Search filters: `utils/postgrestSafe.ts` → `sanitizeSearchTerm()` before `.or()` / `.ilike()` (**SQL / PostgREST injection prevention**)

- Uploads: Multer size/type limits; errors mapped in `errorHandler`



## Environment validation



File: `config/env.ts`



- Zod parses all env vars at boot; invalid → `process.exit(1)`

- **Production** additionally requires:

  - Valid `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

  - Strong `JWT_SECRET` (not default, ≥ 32 chars)

  - R2 + Razorpay configured

- Warns if `CORS_ORIGINS` still contains `localhost` in production



## SQL injection stance



- No raw SQL string concatenation to Postgres

- All DB access via Supabase client (parameterized)

- User search strings must pass `sanitizeSearchTerm` before PostgREST filter interpolation (catalog, students, certificates, notifications, activity logs, live classes, courses)



## Consistent API errors



```json

{

  "success": false,

  "error": {

    "code": "VALIDATION_ERROR",

    "message": "…",

    "details": {},

    "request_id": "…"

  }

}

```



## Residual risks — STOP (not production-complete)



Per policy: **do not claim zero security issues**. These remain:



1. **Zod coverage is incomplete** — many mutating routes still rely on controller/service checks instead of `validate(schema)` on every body/query/params. Close this before a production sign-off.

2. **Service role key** — API holds full DB power; protect `.env`, never expose to clients, rotate if leaked.

3. **ADMIN_EMAILS bootstrap** — allowlisted emails become `super_admin`; keep the list tiny.

4. **File uploads** — R2 path uses magic MIME, size limits, rename, hash dedupe, metadata heuristics, dangerous-ext deny, signed URLs (`docs/api/r2-upload-security.md`). Virus scanning (ClamAV) and EXIF stripping are still not implemented.

5. **Dependency CVEs** — run `npm audit` in CI regularly.

6. **authRateLimiter** — applied to staff-context; consider also login-adjacent / password-reset admin endpoints.



**Status:** hardened baseline (Helmet, CORS, rate limit, compression, body limits, XSS scrub, env fail-fast, JWT via Supabase, consistent errors, PostgREST search sanitize). **Not** signed off as issue-free until (1) is closed.

