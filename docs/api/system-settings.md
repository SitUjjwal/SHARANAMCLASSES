# System Settings

Production platform configuration for SHARANAM CLASSES.

## What you manage

| Field | Purpose |
|-------|---------|
| **App Name** | Brand label (admin sidebar/login, public config) |
| **Logo** | Uploaded to R2 (Supabase fallback in dev); public URL stored |
| **Primary Color** | Hex brand color (`#RRGGBB`) → `--brand-primary` in admin |
| **Support Email / Phone** | Contact channels for apps |
| **Privacy Policy** | Full text/markdown for in-app legal screen |
| **Terms** | Full text/markdown for terms of use |
| **Maintenance Mode** | Blocks non-staff API traffic with `503 MAINTENANCE` |
| **App Version** | Current marketing/release version string |
| **Min App Version** | Hint for force-update checks on clients |
| Timezone | Kept for ops (default `Asia/Kolkata`) |

## Implementation

```
Admin Settings UI
  PUT /admin/settings          (settings:update)
  POST /admin/settings/logo    (multipart logo)
        │
        ▼
systemSettings.service
  platform_settings.key = 'general'  (JSONB, RLS deny-all)
        │
        ├─ 15s in-memory cache
        ├─ activity log settings.update
        └─ invalidate on write
        │
        ▼
GET /public/platform   ← mobile/web bootstrap (no auth)
maintenanceModeGuard   ← 503 for students when flag on; staff bypass
```

### Storage

- Table: `platform_settings` (from `20260803010000`)
- Field expansion migration: `20260803060000_system_settings_fields.sql`
- No new tables — additive JSON keys on `general`
- Logo object key: `branding/logo/{timestamp}-{uuid}.{ext}` on Cloudflare R2

### Security

1. **RLS deny-all** — clients never read/write settings via Supabase keys.
2. **Admin mutate** — `requireAuth` + `requirePermission('settings:update')`.
3. **Public read** — only the safe subset (`PublicPlatformConfig`); no `logo_storage_key` / internal keys.
4. **Maintenance** — global middleware; `/health` + `/public/*` stay up; staff JWT still works.
5. **Validation** — Zod on PUT (hex color, lengths, email).
6. **Logo** — type/size limits (2MB); R2 required in production.

### APIs

| Method | Path | Auth |
|--------|------|------|
| GET | `/public/platform` | None |
| GET | `/admin/settings` | `settings:read` |
| PUT | `/admin/settings` | `settings:update` |
| POST | `/admin/settings/logo` | `settings:update` |

### Admin UI

- Page: **System Settings** (`/settings`)
- Sections: Branding · Support · Legal · Release & maintenance
- After save/upload, refreshes `PlatformProvider` so logo/name/color apply immediately

### Mobile / clients

Call `GET /public/platform` on launch to bind:

- app name, logo, primary color  
- support contacts  
- privacy / terms copy  
- `maintenance_mode` → show maintenance screen  
- compare client build vs `min_app_version` for update prompts  

## Files

| Path | Role |
|------|------|
| `packages/shared/src/types/adminOps.ts` | `PlatformGeneralSettings`, `PublicPlatformConfig` |
| `apps/api/src/services/systemSettings.service.ts` | Core read/write/logo/cache |
| `apps/api/src/middlewares/maintenanceMode.ts` | 503 gate |
| `apps/api/src/routes/systemSettings.routes.ts` | Routes |
| `apps/admin/src/pages/SettingsPage.tsx` | Admin form |
| `apps/admin/src/features/platform/PlatformProvider.tsx` | Live branding |
| `docs/api/system-settings.md` | This doc |
