# Admin panel deployment — SHARANAM CLASSES

Deploy the React (Vite) admin SPA with a **production build**, **build-time env**, **HTTPS**, **caching**, **error / loading pages**, and **SEO** controls for a private staff app.

Related: [backend-deploy.md](./backend-deploy.md) · [production.md](./production.md) · [docker.md](./docker.md)

---

## What you get

| Requirement | How it is satisfied |
|-------------|---------------------|
| **Production build** | `vite build` inside `apps/admin/Dockerfile` → static files in nginx |
| **Environment variables** | `VITE_*` passed as Docker **build-args** (inlined into JS) |
| **HTTPS** | Caddy (`infra/caddy/Caddyfile.admin`) → `admin:80` |
| **Caching** | nginx: `/assets/` immutable 1y; HTML `no-cache`; images 7d; gzip |
| **Error page** | React `ErrorBoundary` + `NotFoundPage`; nginx `404.html` / `50x.html` |
| **Loading page** | HTML `#boot-loader` splash + React `LoadingPage` (session) |
| **SEO** | `noindex,nofollow`, `robots.txt` Disallow, titles, description, OG tags |

---

## Architecture

```
Internet
   │
   ▼
Caddy :443 (HTTPS)  ──►  admin:80 (nginx)
                            │
                            ├─ /assets/*  long-cache (hashed)
                            ├─ /index.html  no-cache
                            ├─ SPA fallback → React Router
                            ├─ /healthz
                            └─ /robots.txt  Disallow: /
```

---

## Files

| File | Role |
|------|------|
| [`apps/admin/Dockerfile`](../../apps/admin/Dockerfile) | Multi-stage Vite build → nginx image |
| [`apps/admin/nginx.conf`](../../apps/admin/nginx.conf) | Caching, gzip, error pages, security headers |
| [`apps/admin/index.html`](../../apps/admin/index.html) | SEO meta + boot loading splash |
| [`apps/admin/public/404.html`](../../apps/admin/public/404.html) | Static 404 |
| [`apps/admin/public/50x.html`](../../apps/admin/public/50x.html) | Static 5xx |
| [`apps/admin/src/components/ErrorBoundary.tsx`](../../apps/admin/src/components/ErrorBoundary.tsx) | Runtime error UI |
| [`apps/admin/src/components/LoadingPage.tsx`](../../apps/admin/src/components/LoadingPage.tsx) | Session / route loading |
| [`apps/admin/src/components/NotFoundPage.tsx`](../../apps/admin/src/components/NotFoundPage.tsx) | In-app 404 |
| [`apps/admin/src/components/DocumentTitle.tsx`](../../apps/admin/src/components/DocumentTitle.tsx) | Per-route `<title>` |
| [`docker-compose.admin.yml`](../../docker-compose.admin.yml) | Admin + Caddy deploy |
| [`infra/caddy/Caddyfile.admin`](../../infra/caddy/Caddyfile.admin) | TLS for admin domain |
| [`.env.admin.example`](../../.env.admin.example) | Domains + `VITE_*` template |

Full stack (API + Admin + HTTPS): [`docker-compose.prod.yml`](../../docker-compose.prod.yml).

---

## Environment variables (build-time)

Vite **bakes** these into the JS bundle. Changing them requires a **rebuild**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | API origin, e.g. `https://api.yourdomain.com` |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key (auth) |
| `VITE_RAZORPAY_KEY_ID` | No | Checkout key if used in admin |

Never put service-role keys in admin env.

---

## Deploy steps

### 1. DNS + firewall

- `ADMIN_DOMAIN` A/AAAA → server
- Open **80** and **443**

### 2. Configure

```bash
cd /path/to/SHARANAM-CLASSES
cp .env.admin.example .env
# Edit: ADMIN_DOMAIN, ACME_EMAIL, VITE_API_BASE_URL, VITE_SUPABASE_*
```

### 3. Build & start

```bash
docker compose -f docker-compose.admin.yml up -d --build
```

Or pull CI image:

```bash
export IMAGE_TAG=<sha7>
export GITHUB_REPOSITORY_OWNER=<owner>
docker compose -f docker-compose.admin.yml pull
docker compose -f docker-compose.admin.yml up -d
```

> Pulling skips rebuild — the image must already contain the correct `VITE_*` values from CI secrets.

### 4. Verify

```bash
curl -fsS http://127.0.0.1:8080/healthz          # ok
curl -fsS https://admin.yourdomain.com/healthz
curl -fsSI https://admin.yourdomain.com/ | head  # HTTPS + headers
# Open https://admin.yourdomain.com/login
```

---

## Requirement notes

### Production build

Dockerfile runs `npm run build --workspace=@sharanam/admin`. Empty Supabase args **fail the build** (avoids white screen).

### Caching

- `/assets/…` → `Cache-Control: public, max-age=31536000, immutable`
- `index.html` → `no-cache` so new deploys appear immediately
- Caddy also `encode gzip zstd`

### Error page

- **React crash** → `ErrorBoundary` (reload / dashboard)
- **Unknown route** → `NotFoundPage`
- **nginx 5xx / missing file** → `50x.html` / `404.html`

### Loading page

1. **Boot:** `#boot-loader` in `index.html` until React mounts  
2. **Auth:** `LoadingPage` while session restores  

### SEO (staff app)

Admin must **not** rank in Google:

- `<meta name="robots" content="noindex, nofollow, noarchive">`
- `/robots.txt` → `Disallow: /`
- Useful titles + description for browser tabs / bookmarks
- `DocumentTitle` updates tab title per route

---

## Local production build (without Docker)

```bash
cd apps/admin
# ensure .env has VITE_*
npm run build
npm run preview   # http://localhost:4173
```

---

## Ops

```bash
docker compose -f docker-compose.admin.yml logs -f admin caddy
docker compose -f docker-compose.admin.yml restart admin
# After VITE_* change:
docker compose -f docker-compose.admin.yml up -d --build
```
