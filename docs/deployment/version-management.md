# Version Management — Architecture

Production versioning for SHARANAM CLASSES mobile releases: SemVer marketing versions, store build numbers, release notes, force and optional updates, and an auditable history.

---

## Goals

| Requirement | How it is delivered |
|-------------|---------------------|
| **Semantic Versioning** | `MAJOR.MINOR.PATCH` validated in API Zod + shared `semver` helpers |
| **Release notes** | Live notes on platform settings + each history row |
| **Force update** | Client &lt; `min_app_version`, **or** `force_update` and client &lt; `app_version` |
| **Optional update** | `optional_update` and client &lt; `recommended_app_version` / latest |
| **Build number** | `android_build_number` (Play `versionCode`) + `ios_build_number` |
| **Version history** | Table `app_version_history` + Admin → **App versions** |

---

## Big picture

```text
┌─────────────────────┐     publish / save policy      ┌──────────────────────┐
│ Admin /versions     │ ─────────────────────────────► │ Express API          │
│ + Settings release  │                                │ appVersion.service   │
└─────────────────────┘                                │ systemSettings       │
                                                       └──────────┬───────────┘
                                                                  │
                    ┌─────────────────────────────────────────────┼────────────────┐
                    ▼                                             ▼                ▼
         platform_settings.general                      app_version_history    activity_logs
         (live policy JSON)                             (immutable releases)
                    │
                    │  GET /public/platform
                    ▼
         ┌──────────────────────┐
         │ Mobile AppUpdateGate │  compare Constants.expoConfig.version
         │ evaluateAppUpdate()  │  → none | optional | force
         └──────────────────────┘
```

**Rule:** Store binary identity comes from `apps/mobile/app.config.js` (`APP_VERSION`, `ANDROID_VERSION_CODE`, `IOS_BUILD_NUMBER`). Remote policy tells installed clients whether they must/should update. Always bump both when shipping.

---

## Policy fields (live)

Stored in `platform_settings` key `general` (also returned by `GET /public/platform`):

| Field | Role |
|-------|------|
| `app_version` | Latest published SemVer |
| `min_app_version` | Hard floor — below → **force** |
| `recommended_app_version` | Soft floor — below → **optional** (falls back to `app_version`) |
| `force_update` | If true, anyone below `app_version` is forced |
| `optional_update` | Master switch for soft prompts |
| `release_notes` | “What’s new” for current latest |
| `android_build_number` | Latest Play `versionCode` |
| `ios_build_number` | Latest iOS build string |
| `store_url_android` / `store_url_ios` | Deep links for Update CTA |

Shared evaluator: `evaluateAppUpdate()` in `@sharanam/shared` (used by API check endpoint and mobile gate).

---

## Decision logic

```text
if client < min_app_version                    → force
else if force_update && client < app_version   → force
else if optional_update && client < recommended (or latest) → optional
else                                           → none
```

Optional prompts can be dismissed once per `latest_version` (SecureStore). Force cannot be dismissed.

---

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | No | Liveness probe (process up) |
| GET | `/ready` | No | Readiness probe (DB + not shutting down) |
| GET | `/version` | No | Live SemVer, build numbers, force/optional flags |
| GET | `/release-notes` | No | Current (or `?version=`) notes + recent history |
| GET | `/public/platform` | No | Branding + full live policy (mobile bootstrap) |
| GET | `/public/version-check?client_version=&platform=` | No | Force/optional evaluation for a client build |
| GET | `/admin/app-versions` | `settings:read` | History list |
| POST | `/admin/app-versions` | `settings:update` | Publish release (± apply as live) |
| PUT/PATCH | `/settings` | `settings:update` | Edit live policy with other settings |

### Example — `GET /version`

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "min_app_version": "1.0.0",
    "recommended_app_version": "1.0.0",
    "android_build_number": 1,
    "ios_build_number": "1",
    "force_update": false,
    "optional_update": true,
    "store_url_android": "https://play.google.com/store/apps/details?id=com.sharanamclasses.app",
    "store_url_ios": "",
    "updated_at": "2026-08-05T00:00:00.000Z"
  }
}
```

### Example — `GET /release-notes` (optional `?version=1.0.0`)

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "release_notes": "Initial release.",
    "android_build_number": 1,
    "ios_build_number": "1",
    "force_update": false,
    "published_at": "2026-08-05T00:00:00.000Z",
    "history": []
  }
}
```

---

## Admin UX

- **Ops → App versions** (`/versions`): live policy form, publish release, history table  
- **Settings → Release & maintenance**: quick edit + link to full versions page  

Publishing a release upserts `app_version_history` by SemVer and (by default) writes the live policy.

---

## Mobile UX

- `AppUpdateGate` wraps `RootNavigator`  
- Reads `/public/platform` via existing `usePublicPlatformQuery`  
- Force: full-screen blocking modal → store URL  
- Optional: dismissible modal with release notes  
- About screen shows SemVer + native build number  

---

## Release runbook

1. Bump `APP_VERSION` / `ANDROID_VERSION_CODE` / `IOS_BUILD_NUMBER` in `app.config.js`  
2. EAS production build → upload to Play/App Store  
3. Admin → App versions → **Publish release** with same SemVer, notes, build numbers  
4. Set `min_app_version` only when you are ready to cut off older clients  
5. Use `force_update` for emergency “everyone on latest”  

---

## Files (canonical)

| Layer | Path |
|-------|------|
| Types | `packages/shared/src/types/appVersion.ts`, `adminOps.ts` |
| SemVer + evaluate | `packages/shared/src/utils/semver.ts`, `appVersion.ts` |
| Migration | `infra/supabase/migrations/20260805010000_app_version_management.sql` |
| API | `apps/api/src/services/appVersion.service.ts`, `routes/appVersion.routes.ts` |
| Admin | `apps/admin/src/pages/VersionsPage.tsx` |
| Mobile | `apps/mobile/src/modules/platform/components/AppUpdateGate.tsx` |
| Binary version | `apps/mobile/app.config.js` |
