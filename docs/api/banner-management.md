# Banner Management

Admin home-slider banners: create, edit, delete, upload image, typed redirect, sort order, enable/disable.

---

## Architecture

```
Admin BannersPage
      │
      ├─ POST /admin/banners/upload-image  → Storage URL
      ├─ POST /admin/banners               → create
      ├─ PATCH /admin/banners/:id          → edit / enable-disable
      └─ DELETE /admin/banners/:id
      │
      ▼
 public.banners
   image, status, sort_order
   redirect_type + redirect_target_id | redirect_url
      │
      ▼
 GET /dashboard.banners  /  GET /banners  (active only)
      │
      ▼
 Mobile BannerSlider → openBannerRedirect
   course → CourseDetail
   test → TestList
   live_class → LiveTab
   website → Linking.openURL
```

| Capability | How |
|------------|-----|
| Create / Edit / Delete | Admin CRUD + API |
| Upload Image | `POST /admin/banners/upload-image` (field `image`) |
| Redirect | `redirect_type`: `none` \| `course` \| `test` \| `live_class` \| `website` |
| Sort Order | `sort_order` (ascending on Home) |
| Enable / Disable | `status` active/inactive + list toggle |

---

## Setup

1. Apply migration `20260802130000_banner_redirects.sql`
2. Restart API
3. Admin → **Banners** → Create Banner

---

## Files

| Path | Role |
|------|------|
| `20260802130000_banner_redirects.sql` | `redirect_type`, `redirect_target_id` |
| `banner.validators.ts` | Zod + redirect rules |
| `banner.service.ts` | CRUD + normalize |
| `BannerForm.tsx` | Admin form (upload + redirect pickers) |
| `BannersPage.tsx` | List, enable toggle, modal editor |
| `openBannerRedirect.ts` | Mobile deep-link routing |
| `BannerSlider.tsx` | Home carousel |
