# Deploy Express API on Railway (no VPS)

Goal: public HTTPS API for the Play Store app, e.g. `https://sharanam-api.up.railway.app`  
Optional later: custom domain `https://api.sharanamclasses.com`

## 1) Create Railway project

1. Open [https://railway.app](https://railway.app) → Sign up (GitHub login OK)
2. **New Project** → **Deploy from GitHub repo**
3. Select **SHARANAM CLASSES** repo (connect GitHub if asked)
4. Railway should detect `railway.toml` + `apps/api/Dockerfile`

If build settings are empty:
- **Dockerfile path:** `apps/api/Dockerfile`
- **Root directory:** `/` (repo root — required for monorepo COPY paths)

## 2) Add environment variables

Railway service → **Variables** → add (copy values from your local `apps/api/.env` — never commit them):

```text
NODE_ENV=production
APP_ENV=production
LOG_TO_CONSOLE=true
LOG_LEVEL=info

# Set AFTER first public URL exists (step 3). Temporary OK:
API_BASE_URL=https://placeholder.up.railway.app

CORS_ORIGINS=https://sharanamclasses.com,https://admin.sharanamclasses.com

ADMIN_EMAILS=ujjwalsharan82@gmail.com

JWT_SECRET=<same as local, min 32 chars>
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://rhamlldhwuxkypxvxson.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase → Settings → API>
SUPABASE_ANON_KEY=<anon key>

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`PORT` — leave unset; Railway injects it.

## 3) Generate public HTTPS URL

1. Service → **Settings** → **Networking** → **Generate domain**
2. Copy URL, e.g. `https://sharanam-api-production-xxxx.up.railway.app`
3. Update variable: `API_BASE_URL=<that exact URL>`
4. Redeploy if needed

Smoke test:

```bash
curl -fsS https://YOUR-RAILWAY-URL/health
curl -fsS https://YOUR-RAILWAY-URL/ready
```

## 4) (Optional) Custom domain

Hostinger DNS for `sharanamclasses.com`:

| Type | Name | Value |
|------|------|--------|
| CNAME | `api` | Railway’s domain target (shown in Railway custom domain UI) |

Or Railway **Custom Domain** → `api.sharanamclasses.com` → follow their DNS instructions.

Then set `API_BASE_URL=https://api.sharanamclasses.com`

## 5) Point the mobile app at the API

```bash
cd apps/mobile
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://YOUR-RAILWAY-OR-CUSTOM-URL --type string --visibility plaintext --environment production --force
```

Bump Android `versionCode`, then:

```bash
npx eas-cli build -p android --profile production
```

Upload new AAB to Play Internal testing.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `npm ci` | Commit a healthy root `package-lock.json` |
| App exits on boot | Check Railway logs — missing R2/Razorpay/JWT/Supabase fails production assert |
| `/health` 200 but app network error | EAS still has `api.yourdomain.com` — rebuild after env update |
| HTTPS redirect loops | Railway sets `X-Forwarded-Proto`; app already has `trust proxy` |
