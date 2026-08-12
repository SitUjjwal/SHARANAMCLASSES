# Deployment Strategy — SHARANAM CLASSES

Target architecture for production. Matches the current monorepo:

| Layer | Tech in repo | Recommended host |
|-------|--------------|------------------|
| **Mobile** | Expo SDK 54 | EAS Build → Google Play (`.aab`) |
| **Backend** | Express API (Docker-ready) | Railway **or** Render → later DigitalOcean / AWS EC2 |
| **Admin** | Vite React SPA | Cloudflare Pages **or** Vercel / Netlify |
| **Database** | Supabase PostgreSQL | Supabase (hosted) |
| **Storage** | Cloudflare R2 | Cloudflare R2 |

Related how-tos: [mobile-play-store.md](./mobile-play-store.md) · [backend-deploy.md](./backend-deploy.md) · [admin-deploy.md](./admin-deploy.md) · [production.md](./production.md)

---

## 1. Big picture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile (Expo)  │     │  Admin (Vite)    │     │  Students later │
│  EAS → Play .aab│     │  CF Pages/Vercel │     │  (same API)     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │  HTTPS                │  HTTPS                 │
         └───────────────────────┼────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  API (Express)         │
                    │  Railway / Render / VPS│
                    │  /health  /ready       │
                    └───────────┬────────────┘
                          │              │
              ┌───────────▼──────┐  ┌────▼────────────┐
              │ Supabase Postgres│  │ Cloudflare R2   │
              │ Auth + DB        │  │ PDFs / media    │
              └──────────────────┘  └─────────────────┘
```

**Rule:** Mobile and Admin never talk to the DB directly for privileged data — only via **API** + Supabase **anon** auth where designed.

---

## 2. Frontend (Mobile) — Expo SDK 54 + EAS + `.aab`

| Item | Choice |
|------|--------|
| Runtime | Expo SDK **54** (`apps/mobile`) |
| Build | **EAS Build** (`eas.json`) |
| Store artifact | **Android App Bundle (`.aab`)** — profile `production` |
| Test artifact | APK — profile `preview` (optional) |
| Package | `com.sharanamclasses.app` |

### Env (EAS `production`)

```text
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

### Commands

```bash
cd apps/mobile
npm run build:android:production   # → .aab for Play
# optional: npm run submit:android
```

### Notes

- Do **not** ship LAN/`localhost` API URLs in Play builds.
- Push needs `google-services.json` + Firebase (optional for first release).
- Full steps: [mobile-play-store.md](./mobile-play-store.md)

---

## 3. Backend (API) — host options

App is already Dockerized (`apps/api/Dockerfile`) with `/health`, `/ready`, graceful shutdown, logging.

### Recommendation order

| Priority | Host | When to use |
|----------|------|-------------|
| **1 — Start** | **Railway** or **Render** | Fast HTTPS, Docker or Node start, low ops |
| **2 — Grow** | **DigitalOcean VPS** | Need Caddy, cron control, fixed IP, cost control |
| **3 — Later** | **AWS EC2** | Scale, compliance, existing AWS org |

### Why not AWS first

EC2 needs more setup (SG, ALB, TLS, deploys). Railway/Render get you **HTTPS + deploy from Git** in one afternoon.

### Env on the API host

Use `apps/api/.env.production.example` as the checklist:

- `NODE_ENV=production` · `APP_ENV=production`
- `API_BASE_URL=https://api.yourdomain.com`
- `CORS_ORIGINS=https://admin.yourdomain.com` (and any web origins)
- Supabase service role, JWT, R2, Razorpay, logging

### Health

- Liveness: `GET /health`
- Readiness: `GET /ready` (DB)

### Railway (example)

1. New project → Deploy from GitHub (root Dockerfile or `apps/api/Dockerfile`)
2. Set env vars from production example
3. Public domain / custom `api.yourdomain.com`
4. Confirm `/health` and `/ready`

### Render (example)

1. Web Service → Docker or `npm run start` in `apps/api`
2. Health check path: `/health`
3. Same env vars

### DigitalOcean VPS (when ready)

Use existing compose + Caddy:

```bash
docker compose -f docker-compose.backend.yml up -d
```

See [backend-deploy.md](./backend-deploy.md).

---

## 4. Admin Panel — static SPA hosts

Admin is a **Vite production build** (static files). Best fit: **Cloudflare Pages**, **Vercel**, or **Netlify**.

| Host | Pros |
|------|------|
| **Cloudflare Pages** | Same vendor as R2; fast CDN; free tier |
| **Vercel** | Simple Git deploy; preview URLs |
| **Netlify** | Similar to Vercel; forms/plugins if needed |

**Primary recommendation:** **Cloudflare Pages** (R2 already in stack).

### Build settings (all three)

| Setting | Value |
|---------|--------|
| Root / monorepo | Repo root; filter `apps/admin` if supported |
| Build command | `npm ci && npm run build --workspace=@sharanam/shared && npm run build --workspace=@sharanam/admin` |
| Output dir | `apps/admin/dist` |
| Node | 22 |

### Build-time env (`VITE_*`)

```text
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_RAZORPAY_KEY_ID=...
```

SPA routing: enable **fallback to `index.html`** (Pages/Vercel/Netlify all support this).

### CORS

API `CORS_ORIGINS` must include the admin URL, e.g. `https://admin.yourdomain.com`.

Docker/Caddy admin path remains valid if you prefer VPS; static hosts are simpler for SPA-only.

---

## 5. Database — Supabase PostgreSQL

| Item | Choice |
|------|--------|
| Product | **Supabase** (hosted Postgres + Auth) |
| Migrations | `infra/supabase/migrations/` |
| API keys | **Service role** only on API; **anon** on mobile/admin |

### Practice

- **Production** project ≠ **staging** project
- Run migrations before cutting traffic
- Never commit service role keys

---

## 6. Storage — Cloudflare R2

| Item | Choice |
|------|--------|
| Product | **Cloudflare R2** |
| Used for | PDFs, uploads, public/signed URLs |
| API env | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` |

Staging should use a **separate bucket** (or prefix) from production.

---

## 7. Suggested production domains

| Service | Example domain |
|---------|----------------|
| API | `https://api.sharanamclasses.com` |
| Admin | `https://admin.sharanamclasses.com` |
| Privacy (Play) | `https://www.sharanamclasses.com/privacy` |
| Mobile | talks only to API + Supabase |

---

## 8. Environments

| Tier | Mobile | API | Admin | Supabase / R2 |
|------|--------|-----|-------|---------------|
| Development | Expo Go / Metro | `localhost:4000` | Vite `:5173` | Dev project OK |
| Staging | EAS preview APK | Railway/Render staging | Pages preview | Separate project + test Razorpay |
| Production | EAS `.aab` → Play | Railway/Render/VPS | Pages/Vercel | Live only |

`APP_ENV` on API: `development` | `staging` | `production`.

---

## 9. Recommended “do this first” path (90 days)

### Phase A — Launch (now)

1. **Supabase** production project + migrations  
2. **R2** production bucket  
3. **API** on **Railway** or **Render** (HTTPS)  
4. **Admin** on **Cloudflare Pages**  
5. **Mobile** EAS **production `.aab`** → Play **internal testing** → production  

### Phase B — Harden

1. Staging stack (second Railway service + second Pages project)  
2. Custom domains + monitoring (`/ready`, admin Monitoring page)  
3. Backups (already in API) on a schedule  

### Phase C — Scale later

1. **DigitalOcean VPS** or **AWS EC2** if you outgrow PaaS  
2. Keep same Docker image; move DNS  

---

## 10. What you already have in the repo

| Need | Status |
|------|--------|
| Expo 54 + EAS `eas.json` | Ready |
| Play `.aab` profile | Ready |
| API Docker + health/ready/shutdown | Ready |
| Admin Vite + nginx Docker | Ready (or use Pages instead) |
| Supabase migrations | Ready |
| R2 integration | Ready |
| Dev / staging / prod compose | Ready (VPS path) |

---

## 11. Decision summary

| Layer | **Use** |
|-------|---------|
| Mobile | Expo 54 → **EAS** → **`.aab`** → Google Play |
| Backend | **Railway or Render** first; DO VPS / **AWS EC2 later** |
| Admin | **Cloudflare Pages** (or Vercel / Netlify) |
| Database | **Supabase PostgreSQL** |
| Storage | **Cloudflare R2** |

Jab Phase A hosts choose ho jayein (Railway vs Render, Pages vs Vercel), next message mein us host ke **click-by-click** steps Hindi mein de sakte hain.
