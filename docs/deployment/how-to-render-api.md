# Deploy Express API on Render (no VPS / Railway)

Repo: https://github.com/SitUjjwal/SHARANAMCLASSES

## 1) Sign up

1. Open [https://render.com](https://render.com)
2. **Sign in with GitHub** (`SitUjjwal`)
3. Allow access to **SHARANAMCLASSES**

## 2) Create Web Service

1. **New** → **Web Service**
2. Select repo **SHARANAMCLASSES**
3. Settings:

| Field | Value |
|-------|--------|
| Name | `sharanam-api` |
| Region | Singapore (or closest) |
| Runtime | **Docker** |
| Dockerfile Path | `./apps/api/Dockerfile` |
| Docker Build Context Directory | `.` (repo root) |
| Instance type | **Free** |

## 3) Environment variables

**Environment** tab → add (from local `apps/api/.env`):

```text
NODE_ENV=production
APP_ENV=production
LOG_TO_CONSOLE=true
LOG_LEVEL=info

API_BASE_URL=https://sharanam-api.onrender.com
CORS_ORIGINS=https://sharanamclasses.com

ADMIN_EMAILS=ujjwalsharan82@gmail.com
JWT_SECRET=<from local .env, 32+ chars>
JWT_EXPIRES_IN=7d

SUPABASE_URL=<from local>
SUPABASE_SERVICE_ROLE_KEY=<from local>
SUPABASE_ANON_KEY=<from local>

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`PORT` — Render sets automatically; do not hardcode.

After first deploy, if the public URL is different, update `API_BASE_URL` to the exact `https://….onrender.com` URL and redeploy.

## 4) Deploy

Click **Create Web Service** → wait for build (Docker monorepo build can take 5–15 min).

Smoke test:

```bash
curl -fsS https://YOUR-SERVICE.onrender.com/health
curl -fsS https://YOUR-SERVICE.onrender.com/ready
```

## 5) Custom domain (optional)

Render → Settings → Custom Domains → `api.sharanamclasses.com`  
Hostinger DNS: CNAME `api` → Render target hostname.

## 6) Mobile app

Set EAS:

```bash
cd apps/mobile
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://YOUR-SERVICE.onrender.com --type string --visibility plaintext --environment production --force
```

Bump `versionCode`, rebuild AAB, upload to Play Internal testing.

## Notes

- Free tier may **sleep** after idle ~15 min; first request can be slow.
- Production assert requires Supabase + JWT + R2 + Razorpay — missing any → crash on boot (check Logs).
- `render.yaml` in repo root supports Blueprint deploy if you prefer **New → Blueprint**.
