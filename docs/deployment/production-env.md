# Production environment variables

Use **canonical** names below in `apps/api/.env` (or Docker `env_file`).  
A template is in [`apps/api/.env.production.example`](../../apps/api/.env.production.example).

## Your list → project names

| You wrote | Use this (canonical) | Notes |
|-----------|----------------------|--------|
| `NODE_ENV=production` | `NODE_ENV=production` | Same |
| `PORT=5000` | `PORT=5000` | OK. Docker image default is `4000`; map host `5000:4000` or set `PORT` in container |
| `SUPABASE_URL=` | `SUPABASE_URL=` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY=` | `SUPABASE_SERVICE_ROLE_KEY=` | Server only |
| `JWT_SECRET=` | `JWT_SECRET=` | Min **32** chars in production |
| `RAZORPAY_KEY=` | **`RAZORPAY_KEY_ID=`** | Alias `RAZORPAY_KEY` also accepted |
| `RAZORPAY_SECRET=` | **`RAZORPAY_KEY_SECRET=`** | Alias `RAZORPAY_SECRET` also accepted |
| `FCM_SERVER_KEY=` | **`FIREBASE_SERVICE_ACCOUNT_JSON=`** (or `_PATH`) | Legacy server key is **not** supported |
| `CLOUDFLARE_ACCOUNT_ID=` | **`R2_ACCOUNT_ID=`** | Alias accepted |
| `CLOUDFLARE_ACCESS_KEY=` | **`R2_ACCESS_KEY_ID=`** | Alias accepted |
| `CLOUDFLARE_SECRET_KEY=` | **`R2_SECRET_ACCESS_KEY=`** | Alias accepted |

## Also required in production

| Variable | Why |
|----------|-----|
| `API_BASE_URL` | Absolute public API URL |
| `CORS_ORIGINS` | Admin origin(s), comma-separated — **no localhost** in prod |
| `ADMIN_EMAILS` | Bootstrap super-admin emails |
| `R2_BUCKET` | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Public CDN/base URL for objects |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification (recommended) |
| `SUPABASE_ANON_KEY` | Optional on API; required on admin/mobile as `VITE_*` / Expo env |

## Admin (Vite) build-time vars

Baked into the admin image — set as CI secrets / compose build-args:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY_ID=
```

## Minimal production `.env` (API)

```env
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://admin.yourdomain.com
ADMIN_EMAILS=you@yourdomain.com
JWT_SECRET=...at-least-32-chars...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=sharanam-pdfs
R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

On boot with `NODE_ENV=production`, the API **exits** if Supabase, JWT, R2, or Razorpay are missing/invalid.
