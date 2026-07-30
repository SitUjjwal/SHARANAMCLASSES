# Module 1 Walkthrough — Architecture, Files & Dependencies

This guide explains **why** each Module 1 piece exists, **how** it works, and **how** later modules will reuse it.
Do not start Module 2 until this checklist stays green.

---

## 1. Monorepo folders (top level)

| Folder | Why it exists |
| --- | --- |
| `apps/` | Deployable applications (mobile, admin, api) |
| `apps/mobile/` | Student Expo app |
| `apps/api/` | Express backend (source of truth for business logic) |
| `apps/admin/` | Staff web panel (Module later) |
| `packages/` | Shared libraries (`shared` types, tsconfig, eslint) |
| `infra/supabase/` | SQL migrations / DB schema as code |
| `docs/` | Architecture notes and learning guides |

---

## 2. Backend (`apps/api`) — folders

| Folder | Responsibility |
| --- | --- |
| `src/config/` | Env parsing + Supabase client factory (no business logic) |
| `src/controllers/` | HTTP layer: read request → call service → send response |
| `src/routes/` | URL paths mapped to controllers |
| `src/middlewares/` | Cross-cutting: errors, rate limit, validation, auth later |
| `src/services/` | Business logic / orchestration |
| `src/models/` | Domain entity types (filled in later modules) |
| `src/utils/` | Helpers (`AppError`, JWT) |
| `src/integrations/` | Vendor SDKs (R2, Razorpay, FCM, YouTube) — stubs for now |

**Request flow:**

```
Client → routes → middlewares → controllers → services → integrations/DB → response
```

---

## 3. Backend dependencies (why each one)

| Package | Why installed |
| --- | --- |
| `express` | HTTP server framework |
| `typescript` / `tsx` | Typed code + run/watch without a separate compile step in dev |
| `dotenv` | Load `apps/api/.env` into `process.env` |
| `zod` | Validate env + request payloads safely |
| `helmet` | Security HTTP headers |
| `cors` | Allow mobile/admin origins to call the API |
| `morgan` | Request logging |
| `compression` | Gzip responses |
| `cookie-parser` | Read cookies (sessions / refresh tokens later) |
| `express-rate-limit` | Stop abuse / brute force |
| `jsonwebtoken` | Sign/verify JWTs (auth modules later) |
| `@supabase/supabase-js` | Talk to Supabase Auth + PostgreSQL (PostgREST) |
| `eslint` + TS plugins | Catch style/bugs before runtime |

---

## 4. Backend files — why each exists

### Entry

| File | Why | Future use |
| --- | --- | --- |
| `src/server.ts` | Boots the process and listens on `PORT` | Same entry in production (`node dist/server.js`) |
| `src/app.ts` | Builds Express app: middleware + routes | All new route mounts go here (or via `routes/index`) |

### Config

| File | Why | Future use |
| --- | --- | --- |
| `src/config/env.ts` | Validates env with Zod; fails fast if invalid | Add Razorpay/R2/FCM vars here as modules land |
| `src/config/index.ts` | App config object derived from env | Services read `config` instead of raw `process.env` |
| `src/config/supabase.ts` | Secure **service-role** Supabase client | Auth, courses, payments, storage metadata queries |

### Health & database

| File | Why | Future use |
| --- | --- | --- |
| `controllers/health.controller.ts` | `GET /health` liveness | Load balancers / uptime monitors |
| `routes/health.routes.ts` | Mounts `/health` | Keep health outside versioned `/api/v1` |
| `services/database.service.ts` | Probes Postgres via `app_meta` select | Pattern for all future DB services |
| `controllers/database.controller.ts` | HTTP wrapper for DB status | Ops / Module 1 verification |
| `routes/database.routes.ts` | `GET /database-status` | Same pattern for future status routes |

### Cross-cutting

| File | Why | Future use |
| --- | --- | --- |
| `middlewares/errorHandler.ts` | Uniform JSON errors | All modules throw `AppError` |
| `middlewares/notFoundHandler.ts` | 404 for unknown routes | — |
| `middlewares/rateLimiter.ts` | Global request throttle | Tighten on auth/payment routes later |
| `middlewares/validate.ts` | Zod body/query/params validation | Login, enroll, checkout payloads |
| `middlewares/auth.ts` | Placeholder for JWT/Supabase auth | Protect student/admin routes |
| `utils/AppError.ts` | Typed HTTP errors | Controllers/services |
| `utils/jwt.ts` | Sign/verify helpers | Custom tokens if needed alongside Supabase Auth |

### Infra

| File | Why | Future use |
| --- | --- | --- |
| `infra/supabase/migrations/20260731000000_app_meta.sql` | Tiny probe table for connectivity | More migrations for users, courses, payments |

---

## 5. Mobile (`apps/mobile`) — folders

| Folder | Responsibility |
| --- | --- |
| `src/api/` | Axios client + React Query client |
| `src/services/` | Functions that call API endpoints |
| `src/screens/` | Full-screen UI |
| `src/navigation/` | React Navigation stacks/tabs |
| `src/components/` | Reusable UI pieces (later) |
| `src/hooks/` | Shared React hooks (later) |
| `src/store/` | Zustand client state |
| `src/constants/` | App constants + typed env |
| `src/theme/` | Colors / spacing / typography |
| `src/types/` | Navigation + DTOs |
| `src/utils/` | Pure helpers |
| `assets/` | Icons, splash images |

---

## 6. Mobile dependencies (why each one)

| Package | Why installed |
| --- | --- |
| `expo` / `react-native` | App runtime (SDK 54) |
| `typescript` | Typed React Native |
| `@react-navigation/native` + `native-stack` | Screen navigation |
| `react-native-screens` | Native screen containers (perf) |
| `react-native-safe-area-context` | Notch / status bar safe layout |
| `react-native-gesture-handler` | Gestures for navigation |
| `react-native-reanimated` | Smooth animations |
| `axios` | HTTP client to backend |
| `@tanstack/react-query` | Server-state cache / retries (courses later) |
| `zustand` | Lightweight client state |
| `react-hook-form` | Forms (login, profile later) |
| `eslint` / `prettier` | Quality tooling |

---

## 7. Mobile files — why each exists

| File | Why | Future use |
| --- | --- | --- |
| `index.ts` | Registers root component; imports gesture-handler first | App entry forever |
| `App.tsx` | Providers: Gesture → SafeArea → React Query → Navigator | Add AuthProvider later |
| `src/constants/env.ts` | Reads `EXPO_PUBLIC_*` safely | API URL, Supabase anon, Razorpay public key |
| `src/api/client.ts` | Shared Axios instance with `baseURL` | All feature services import this |
| `src/api/queryClient.ts` | React Query defaults | `useQuery` / `useMutation` for courses, etc. |
| `src/services/health.service.ts` | `GET /health` | Pattern for `courses.service.ts`, etc. |
| `src/screens/HomeScreen.tsx` | Calls health; shows loading / success / error | Replace with real home after auth |
| `src/navigation/RootNavigator.tsx` | Stack navigator shell | Add Auth stack + Tabs |
| `src/store/useAppStore.ts` | Zustand scaffold | Session flags, UI prefs |
| `src/theme/index.ts` | Design tokens | Consistent UI across screens |

---

## 8. How Module 1 code works (end-to-end)

1. **API starts** → `server.ts` → `createApp()` applies security/logging middleware → mounts routes.
2. **Mobile starts** → `index.ts` → `App.tsx` providers → `HomeScreen`.
3. **HomeScreen** calls `getHealth()` → Axios → `EXPO_PUBLIC_API_BASE_URL/health`.
4. **API** `health.controller` returns `{ status: "ok" }`.
5. Mobile shows **Backend Connected**.
6. **Database check** (ops): `GET /database-status` → Supabase service client → `SELECT` on `app_meta` → `{ status: "Database Connected" }`.

---

## 9. How later modules reuse this

| Later module | Reuses |
| --- | --- |
| Auth | `middlewares/auth`, JWT/Supabase, mobile services + screens |
| Courses | `services/` + `controllers/` + mobile `services/` + React Query |
| Payments (Razorpay) | `integrations/razorpay`, webhooks route, mobile checkout |
| Media (R2) | `integrations/r2`, signed upload URLs |
| Push (FCM) | `integrations/fcm`, device token APIs |
| Admin panel | Same API contracts via `@sharanam/shared` |

---

## 10. Module 1 success criteria

- [x] Expo starts (`cd apps/mobile && npx expo start`)
- [x] API starts (`npm run dev -w @sharanam/api`)
- [x] `GET /health` → `{"status":"ok"}`
- [x] Mobile shows Backend Connected
- [x] `GET /database-status` → `{"status":"Database Connected"}`
- [x] TypeScript clean
- [x] ESLint clean

**Rule for next work:** after every new file, explain (1) why it exists (2) folders (3) deps (4) how code works (5) future use (6) comments (7) confirm build before next feature.
