# Launch Checklist — SHARANAM CLASSES

**Purpose:** Go-live gate for production (API + Supabase + R2 + Admin + Android Play).  
**Audience:** Founder / ops before first public release.  
**Related:** [strategy.md](./strategy.md) · [production-env.md](./production-env.md) · [mobile-play-store.md](./mobile-play-store.md) · [play-store-assets.md](./play-store-assets.md)

Mark each box only when **verified on production** (or intentional “N/A” for first release).

Legend: `[ ]` todo · `[x]` done · **Why** = why this item exists

---

## Feature smoke status (reported 5 Aug 2026)

Core product paths verified (backend stack + admin + learning features):

| Area | Status |
|------|--------|
| Backend | ✅ Running |
| Database | ✅ Connected |
| Cloudflare R2 | ✅ Working |
| Payments | ✅ Verified |
| Notifications | ✅ Working |
| Videos | ✅ Playing |
| PDF | ✅ Opening |
| Tests | ✅ Working |
| Live Classes | ✅ Working |
| Admin | ✅ Working |

### Legal site (deployed 5 Aug 2026)

| Item | URL |
|------|-----|
| **Home** | https://sharanam-legal.vercel.app/ |
| **Privacy (Play)** | https://sharanam-legal.vercel.app/privacy/ |
| **Terms** | https://sharanam-legal.vercel.app/terms/ |
| **Refund** | https://sharanam-legal.vercel.app/refund/ |
| **Cancellation** | https://sharanam-legal.vercel.app/cancellation/ |
| **Cookies** | https://sharanam-legal.vercel.app/cookies/ |
| **Support** | https://sharanam-legal.vercel.app/support/ |

Host: Vercel project `sharanam-legal` (account `situjjwal`). Custom domain optional later.

**Verdict:** Product features + public legal URLs are ready. Remaining: Play Console paste + production AAB.

### Still open for public launch

| Priority | Item | Why |
|----------|------|-----|
| 1 | Play Console → paste Privacy URL (below) | Store listing requirement |
| 2 | Data safety form from `data-safety.md` | App content questionnaire |
| 3 | Production API URL in EAS AAB (not LAN) | Play users cannot reach your PC |
| 4 | Screenshots + Internal testing AAB | Review + device smoke |
| 5 | Firebase / `google-services.json` (if push on release builds) | Expo Go ≠ production FCM |

Detailed checkboxes below remain for ops hardening (secrets rotation, webhooks, CORS, etc.).

---

## How to use this doc

1. Work **top to bottom** — Backend/DB before Android AAB.  
2. Prefer a **staging** pass first, then repeat on production with live keys.  
3. Do not ship Play builds that still point at LAN / `localhost` API URLs.  
4. After launch day, keep this file as an ops runbook for the next release.

---

## 1. Backend (Express API)

The API is the only trusted server for enrollments, admin actions, webhooks, and privileged DB/R2 work. If it is wrong, every client fails.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | **Host chosen & deployed** (Railway / Render / VPS) | Public HTTPS endpoint students and admin call. Without a stable host, mobile cannot leave Expo Go / LAN. |
| [ ] | `APP_ENV=production` + `NODE_ENV=production` | Tells the app it is live: stricter secret checks, correct logs, probes show the right tier. |
| [ ] | All secrets from `.env.production.example` set | Missing Supabase / JWT / R2 / Razorpay → API **refuses to start** in production (by design). |
| [ ] | `API_BASE_URL` = public HTTPS URL | Used for absolute links, webhooks, and clients; must match what the world calls. |
| [ ] | `CORS_ORIGINS` includes only live admin origin(s) | Blocks random websites from calling the API with a browser. No `localhost` in prod. |
| [ ] | `JWT_SECRET` ≥ 32 characters (unique to prod) | Signs/verifies app tokens. Reusing a weak/dev secret lets attackers forge sessions. |
| [ ] | `GET /health` returns 200 | **Liveness** — process is up (load balancer / Docker can restart if not). |
| [ ] | `GET /ready` returns ready + DB ok | **Readiness** — safe to send traffic; fails if DB down or shutting down. |
| [ ] | Graceful shutdown works (SIGTERM) | In-flight requests finish; `/ready` goes 503 so deploys don’t cut users mid-request. |
| [ ] | Logs shipping / retention known | JSON logs with `app_env` help debug payments and crashes after launch. |
| [ ] | Rate limiting + Helmet headers on | Reduces abuse and common HTTP attack surface on a public API. |
| [ ] | Cron / background jobs (e.g. backups) confirmed | Scheduled work only runs if the API process stays up with jobs enabled. |

**Smoke:** `curl -fsS https://api.YOURDOMAIN/health` and `/ready`.

---

## 2. Database (Supabase PostgreSQL)

Supabase holds accounts, courses, enrollments, and learning records. Wrong project or unfinished migrations = empty or broken app.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | **Dedicated production project** (not the same as local/dev) | Isolates live student data from experiments and accidental wipes. |
| [ ] | All migrations in `infra/supabase/migrations/` applied | Schema must match API expectations (tables, RLS policies, functions). |
| [ ] | `SUPABASE_URL` + **service role** on API only | Service role bypasses RLS — never put it in mobile/admin bundles. |
| [ ] | Anon key on mobile/admin only | Clients authenticate as users; privileged writes go through the API. |
| [ ] | Auth providers configured (email / phone as used) | Students must be able to sign up/sign in the same way you demo’d. |
| [ ] | Auth redirect / site URLs include production domains | Wrong URLs break magic links and OAuth if you enable them. |
| [ ] | RLS reviewed for student-facing tables | Stops one student reading another’s private rows if they hit Supabase directly. |
| [ ] | Backup strategy understood | Supabase backups + in-app backup feature (if used) for restore drills. |
| [ ] | Connection limits / pooler OK under load | Prevents “too many connections” when admin + mobile spike. |

**Smoke:** Admin login + create/list one course; mobile login shows profile.

---

## 3. Storage (Cloudflare R2)

R2 stores PDFs, media, and uploads. Misconfigured bucket = broken notes/videos even if DB is fine.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | Production bucket (separate from staging) | Avoids overwriting or leaking staging test files into live. |
| [ ] | `R2_ACCOUNT_ID` / access key / secret / `R2_BUCKET` on API | API signs uploads and serves object URLs; wrong creds → 500 on upload. |
| [ ] | `R2_PUBLIC_BASE_URL` correct (custom domain or `r2.dev`) | Clients must open the same base URL the API writes into the DB. |
| [ ] | Bucket CORS / public access policy matches product | Public PDFs need readable URLs; private objects need signed URLs only. |
| [ ] | Upload path tested (admin → PDF/video → mobile open) | End-to-end proof that bytes land in R2 and the app can fetch them. |
| [ ] | Size / type limits known | Prevents one huge file from filling the bucket or timing out. |

**Smoke:** Upload a small PDF in admin; open it in the student app.

---

## 4. Firebase

Firebase (with Expo) powers **push notifications** on Android. Optional for a content-only first release, but required if you promise pushes.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | Firebase project created for production | Holds FCM credentials and Android app registration. |
| [ ] | Android app added: package `com.sharanamclasses.app` | FCM only delivers to the registered package name. |
| [ ] | `google-services.json` in mobile build (EAS secret / file) | Native Android config so the device can register for FCM. |
| [ ] | API has `FIREBASE_SERVICE_ACCOUNT_JSON` (or `_PATH`) | Server sends pushes; legacy `FCM_SERVER_KEY` is **not** supported in this codebase. |
| [ ] | Push permission + token save tested on a real device | Emulators / Expo Go have limits; Play/internal build is the truth. |
| [ ] | N/A decision documented if skipping push for v1 | Play listing and Data safety must match “no notifications” if you skip. |

**Smoke:** Admin/API send test notification → device receives while app backgrounded.

---

## 5. Payments (Razorpay)

Payments unlock enrollments. Test keys in production (or live keys without webhooks) cause money/access mismatches.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | Razorpay **live** mode for production | `rzp_live_…` keys; test keys must stay on staging only. |
| [ ] | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` on API | Creates orders and verifies signatures server-side. |
| [ ] | `EXPO_PUBLIC_RAZORPAY_KEY_ID` / admin `VITE_RAZORPAY_KEY_ID` = **same live key id** | Checkout UI must use the public key that matches the API secret pair. |
| [ ] | `RAZORPAY_WEBHOOK_SECRET` set + webhook URL = prod API | Webhooks confirm payment if the app closes mid-checkout; signature stops fakes. |
| [ ] | Webhook events subscribed (payment captured / failed as designed) | Enrollment unlock depends on the events your API handles. |
| [ ] | Success path: pay → enrollment unlocked | Happy path for revenue. |
| [ ] | Failure / cancel path: no false enrollment | User must not get paid content without a verified payment. |
| [ ] | Refund ops known (dashboard + [Refund Policy](../../apps/mobile/store-assets/legal/refund-policy.md)) | Support can reverse access and money consistently. |

**Smoke:** Small live (or staging test) purchase; verify DB enrollment + Razorpay dashboard.

---

## 6. Notifications

Covers **push**, in-app notification inbox, and optional email/SMS later. Separate from “Firebase credentials exist.”

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | Notification preferences UI works | Users can turn off optional pushes (privacy + Play expectations). |
| [ ] | Class / announcement / payment events create inbox rows | Students see history even if push is denied. |
| [ ] | Push payload opens the right screen (deep link) | Tapping a live-class push should land on that class, not a blank home. |
| [ ] | No spam: rate / batching for mass sends | Protects reputation and device battery. |
| [ ] | Staff know how to send from admin | Ops can announce without engineering help. |

**Smoke:** Send announcement → appears in app list ± push.

---

## 7. Admin (Vite SPA)

Admin is how the institute runs content, students, and support. Wrong `VITE_*` bake = talking to the wrong API forever until rebuild.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | Deployed (Cloudflare Pages / Vercel / Docker+nginx) | HTTPS admin URL for staff only (or VPN later). |
| [ ] | Build env: `VITE_API_BASE_URL` = prod API | All admin API calls go to production, not laptop IP. |
| [ ] | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` = prod project | Admin auth against the live user directory. |
| [ ] | `ADMIN_EMAILS` / roles allow your super-admin | First login bootstrap; wrong list locks you out. |
| [ ] | CORS on API allows this admin origin | Browser blocks admin ↔ API if origin missing. |
| [ ] | Critical pages smoke: courses, students, live classes, payments, notifications | Proves staff can run day-1 operations. |
| [ ] | `noindex` / access control as intended | Avoid accidental public indexing of the admin SPA. |

**Smoke:** Login → create course → assign content → see student list.

---

## 8. Android (Expo / Play Store)

Store release is irreversible for users until you ship an update. Config baked into the AAB cannot be fixed without a new build.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | EAS production profile uses **HTTPS** `EXPO_PUBLIC_API_BASE_URL` | LAN URLs work at home and die on Play users’ phones. |
| [ ] | Supabase anon + Razorpay key id set in EAS secrets/env | Auth and checkout must hit production backends. |
| [ ] | `EXPO_PUBLIC_APP_ENV=production` | Feature flags / logging behave as production. |
| [ ] | `version` + `versionCode` correct for this release | Play rejects reuse of an old `versionCode`. |
| [ ] | Production **AAB** built (`eas build -p android --profile production`) | Play requires App Bundle, not a debug APK. |
| [ ] | Internal testing track installed on real device | Catches signing, permissions, and API URL issues before production. |
| [ ] | Store listing: title, short/full description, screenshots, feature graphic | Required for review; see `apps/mobile/store-assets/`. |
| [ ] | Privacy Policy URL live HTTPS | Play blocks listing without a public privacy page (`apps/web-legal/`). |
| [ ] | Support email + URL | Users and reviewers need a contact path. |
| [ ] | Data safety form completed ([data-safety.md](../../apps/mobile/store-assets/legal/data-safety.md)) | Declares what you collect; must match the app. |
| [ ] | Content ratings / target audience answered | Policy questionnaires for education apps. |
| [ ] | Account deletion path published (email support at minimum) | Play requirement for apps with accounts. |

**Smoke:** Internal build: login, open note, start test, (optional) pay.

---

## 9. Security

Security is cross-cutting: one leak (service role in the app, open CORS, webhook without verify) can expose the whole institute.

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | No secrets in git / client bundles | Service role, Razorpay secret, JWT, Firebase JSON stay server-side or EAS secure storage. |
| [ ] | HTTPS everywhere (API, admin, legal, R2 URLs) | Encrypts tokens and payment sessions in transit. |
| [ ] | Production JWT / DB passwords rotated from any shared-dev values | Old Discord/shared `.env` must not unlock production. |
| [ ] | Webhook signature verification on (Razorpay) | Stops attackers faking “payment success.” |
| [ ] | Admin accounts least-privilege roles | Support staff shouldn’t get destructive super-admin by default. |
| [ ] | Rate limits + auth on sensitive routes | Login, OTP, payment, upload endpoints are abuse magnets. |
| [ ] | Legal pages live: Privacy, Terms, Refund, Cancellation, Cookies | Trust + Play + consumer clarity (`apps/web-legal/`). |
| [ ] | Dependency / image updates plan | Reduces known CVE exposure on Node base images. |

**Smoke:** Call a protected API without token → 401; with student token → cannot hit admin-only routes.

---

## 10. Testing

Testing proves the checklist; unchecked boxes mean “unknown,” not “fine.”

| Done | Item | Explanation |
|------|------|-------------|
| [ ] | CI green (lint / unit tests / build) | Catches regressions before you promote an image or AAB. |
| [ ] | API health + ready on prod | Infrastructure baseline. |
| [ ] | Auth: sign-up / login / logout / session restore | Core funnel; failure = zero engagement. |
| [ ] | Content: course → chapter → video/PDF | Learning path must open without blank screens. |
| [ ] | Live class join / schedule display | Differentiator for the product; timezone & link correctness. |
| [ ] | Tests / results / leaderboard (if shipped) | Writes scores; verify no cross-user leakage. |
| [ ] | Payments + enrollment (staging then prod) | Money path; do a real small charge if going live. |
| [ ] | Notifications (in-app ± push) | Engagement loop. |
| [ ] | Admin CRUD smoke on prod | Staff can fix content without a redeploy. |
| [ ] | Backup / restore drill (or Supabase PITR known) | Launch day is late to discover backups don’t restore. |
| [ ] | Performance spot-check (list pages, images) | Slow lists feel like a broken app on cheap Androids. |
| [ ] | Rollback plan written | Bad AAB or bad API deploy: previous AAB track + previous API image/commit. |

**Minimum launch day script (30–45 min):**

1. `/health` + `/ready`  
2. Admin login + one content edit  
3. Student login on internal AAB  
4. Open PDF + one test attempt  
5. One payment (or staging payment if soft-launch)  
6. One notification  
7. Privacy URL opens without login  

---

## Launch day order (recommended)

```text
1. Database migrations + R2 bucket
2. Backend deploy + secrets → /health /ready
3. Firebase (if push) + Razorpay live webhook
4. Admin deploy (VITE_* → prod)
5. Legal site (apps/web-legal) on HTTPS
6. EAS production AAB (HTTPS API URL) → Internal testing
7. Play listing + Data safety
8. Full testing section above
9. Promote to Production track
```

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Backend / DB | | 5 Aug 2026 | Feature smoke: API, DB, R2, payments, notifications ✅ |
| Product / Admin | | 5 Aug 2026 | Videos, PDF, tests, live classes, admin ✅ |
| Mobile / Play | | | Pending: HTTPS legal + prod AAB + Play Console |
| Founder | | | |

**Go / No-Go:** **Soft Yes** on product + legal HTTPS · Play listing still needs URL paste + AAB  

**Blockers (if No-Go):** Paste Privacy in Play; EAS production `EXPO_PUBLIC_API_BASE_URL` must be HTTPS (not LAN).

---

## Quick links

| Area | Doc / path |
|------|------------|
| Host strategy | [strategy.md](./strategy.md) |
| API deploy | [backend-deploy.md](./backend-deploy.md) |
| Admin deploy | [admin-deploy.md](./admin-deploy.md) |
| Env names | [production-env.md](./production-env.md) |
| Play Store | [mobile-play-store.md](./mobile-play-store.md) |
| Legal HTML | `apps/web-legal/` |
| Legal markdown | `apps/mobile/store-assets/legal/` |
| Prior smoke (local Docker) | [production-testing-checklist.md](./production-testing-checklist.md) |
