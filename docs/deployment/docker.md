# SHARANAM CLASSES — Docker & CI/CD
#
# Containerizes the API (Express) and Admin (Vite → nginx).
# Mobile (Expo) is not containerized; ship via EAS / stores.
#
# Quick start (local / development):
#   cp .env.docker.example .env
#   cp apps/api/.env.example apps/api/.env   # fill secrets
#   docker compose -f docker-compose.yml up --build -d
#
# Staging:
#   docker compose -f docker-compose.staging.yml pull && up -d
#
# Production (server with images from GHCR):
#   export IMAGE_TAG=<git-sha-short>
#   export GITHUB_REPOSITORY_OWNER=<lowercase-github-org-or-user>
#   docker compose -f docker-compose.prod.yml pull
#   docker compose -f docker-compose.prod.yml up -d
#
# Full production readiness guide: docs/deployment/production.md

## File map

| Path | Role |
|------|------|
| `.dockerignore` | Keeps build context small/safe (no `.env`, mobile, node_modules) |
| `Dockerfile` | Default `docker build .` → same as API production image |
| `apps/api/Dockerfile` | Multi-stage production image for the Express API |
| `apps/admin/Dockerfile` | Multi-stage: Vite build → nginx static SPA |
| `apps/admin/nginx.conf` | SPA routing, `/healthz`, gzip, security headers |
| `docker-compose.yml` | **Development** build + run (`APP_ENV=development`) |
| `docker-compose.staging.yml` | **Staging** pull from GHCR `:staging` |
| `docker-compose.prod.yml` | **Production** API + Admin + Caddy HTTPS |
| `docker-compose.backend.yml` | **Backend-only** API + Caddy HTTPS |
| `infra/caddy/Caddyfile` | Let's Encrypt TLS for API + Admin |
| `infra/caddy/Caddyfile.backend` | Let's Encrypt TLS for API only |
| `.env.docker.example` | Template for root `.env` (compose interpolation) |
| `.env.backend.example` | Domains + ACME for HTTPS deploy |
| `.github/workflows/ci.yml` | Lint → typecheck → test → build → Docker smoke |
| `.github/workflows/deploy.yml` | Prod: push images to GHCR + optional SSH deploy |
| `.github/workflows/deploy-staging.yml` | Staging: push `:staging` + optional SSH deploy |
| `docs/deployment/production.md` | Production readiness + every-file explanations |
| `docs/deployment/backend-deploy.md` | Backend deploy (Docker, HTTPS, health, headers, logs) |

---

## `.dockerignore`

Excludes secrets, git metadata, mobile app, `node_modules`, and build artifacts from the Docker **build context**. Smaller context = faster builds and no accidental `.env` leakage into layers.

---

## `Dockerfile` (repo root)

Same production API image as `apps/api/Dockerfile`. Exists so `docker build -t sharanam-api .` works without `-f`. Prefer `apps/api/Dockerfile` / `apps/admin/Dockerfile` in compose and CI so each service stays explicit.

---

## `apps/api/Dockerfile`

Three stages:

1. **deps** — `npm ci` for `@sharanam/api` + `@sharanam/shared` (workspace-aware).
2. **build** — compiles TypeScript shared + API → `dist/`.
3. **runner** — production `node_modules` only (`--omit=dev`), copies `dist`, runs as non-root `node` user.

- Exposes **4000**
- `HEALTHCHECK` hits `GET /health`
- Logs directory: `/app/logs` (mounted as a volume in compose)
- Start: `node dist/server.js`

Build:

```bash
docker build -f apps/api/Dockerfile -t sharanam-api:local .
```

---

## `apps/admin/Dockerfile`

Two stages:

1. **build** — `npm ci`, builds shared + Vite admin. **`VITE_*` must be passed as build-args** (baked into the JS bundle).
   - **Required:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (set in **repo root** `.env`).
   - Empty values used to cause a **white page**; the Dockerfile now **fails the build** if they are missing.
   - Copy from `apps/admin/.env` into root `.env`, then: `docker compose build admin && docker compose up -d`
2. **runner** — `nginx:alpine` serves `dist/` with `apps/admin/nginx.conf`.

- Exposes **80**
- Health: `GET /healthz`

Build:

```bash
docker build -f apps/admin/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  -t sharanam-admin:local .
```

---

## `apps/admin/nginx.conf`

- `/healthz` — liveness for Docker / load balancers
- `/assets/` — long-cache hashed Vite files
- `/` — `try_files` → `index.html` for React Router
- gzip + basic security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)

---

## `docker-compose.yml`

Builds and runs **api** + **admin** from source.

| Service | Image | Host port (default) |
|---------|-------|---------------------|
| `api` | `sharanam-api:local` | `API_PORT` → 4000 |
| `admin` | `sharanam-admin:local` | `ADMIN_PORT` → 8080 |

- API secrets: `apps/api/.env` (`env_file`)
- Compose vars (ports, `VITE_*`, CORS): root `.env` from `.env.docker.example`
- Admin waits until API healthcheck passes
- Persistent volume `sharanam-api-logs` → `/app/logs`

```bash
cp .env.docker.example .env
# edit .env and apps/api/.env
docker compose up --build -d
docker compose ps
curl http://localhost:4000/health
curl http://localhost:8080/healthz
```

---

## `docker-compose.prod.yml`

Same topology, but **pulls** images from GitHub Container Registry instead of building:

- `ghcr.io/<owner>/sharanam-api:<IMAGE_TAG>`
- `ghcr.io/<owner>/sharanam-admin:<IMAGE_TAG>`

Set on the server:

```bash
export GITHUB_REPOSITORY_OWNER=your-github-user-or-org   # lowercase
export IMAGE_TAG=abc1234                                 # or latest
docker login ghcr.io
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Keep `apps/api/.env` on the server (never commit). Redeploy admin only after changing `VITE_*` (new image build required).

---

## `.env.docker.example`

Non-secret defaults for **compose variable substitution** (ports, public Vite URLs, CORS). Copy to **repo root** `.env`. Real API keys stay in `apps/api/.env`.

---

## `.github/workflows/ci.yml`

Runs on push/PR to `main` / `master` / `develop`.

**Job `lint-test-build`**

1. Checkout + Node from `.nvmrc` + npm cache  
2. `npm ci`  
3. Build `@sharanam/shared`  
4. **Lint** — API + Admin (+ Shared if present); mobile lint stays local/EAS  
5. **Typecheck** — `npm run typecheck`  
6. **Tests** — API Vitest (`npm run test --workspace=@sharanam/api`)  
7. **Build** — API + Admin (placeholder `VITE_*` for CI)

**Job `docker`**

- After CI passes, Buildx builds API + Admin images with **push: false** (smoke that Dockerfiles work). Uses GitHub Actions cache.

---

## `.github/workflows/deploy.yml`

Runs on push to `main`/`master`, or manually (`workflow_dispatch`).

**Job `build-push`**

- Logs into **GHCR** with `GITHUB_TOKEN`
- Builds/pushes:
  - `ghcr.io/<owner>/sharanam-api:<sha7>` + `:latest`
  - `ghcr.io/<owner>/sharanam-admin:<sha7>` + `:latest`
- Admin build-args from repository **secrets**:  
  `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`

**Job `deploy` (SSH)**

Runs when:

- Push **and** repository variable `DEPLOY_ENABLED=true`, or  
- Manual workflow with `skip_deploy=false`

Required secrets:

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | Server hostname/IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key |
| `DEPLOY_PATH` | Absolute path to repo/compose on server |
| `DEPLOY_PORT` | Optional SSH port (default 22) |
| `GHCR_PULL_TOKEN` | Optional PAT with `read:packages` (else job token) |
| `VITE_*` | Baked into admin image at push time |

On the server, `DEPLOY_PATH` must contain `docker-compose.prod.yml` and `apps/api/.env`.

To enable auto-deploy: **Settings → Variables → `DEPLOY_ENABLED` = `true`**.

Until then, pushes only publish images; deploy with **Actions → Deploy → Run workflow**.

---

## Production checklist

1. Apply Supabase migrations on the production project.  
2. Place filled `apps/api/.env` on the server (Supabase, R2, Razorpay, Firebase, etc.).  
3. Set GitHub secrets for `VITE_*` and deploy SSH.  
4. Ensure GHCR packages are pullable by the server (`GHCR_PULL_TOKEN` or public packages).  
5. Open firewall for API (`4000` or reverse-proxy) and admin (`80`/`443`).  
6. Prefer a reverse proxy (Caddy/nginx/Traefik) for TLS in front of compose ports.  
7. Mobile remains on Expo/EAS — not part of this compose stack.

---

## What is not containerized

- **Expo mobile app** — native/EAS builds, not Docker.  
- **Supabase** — hosted (or your own Supabase stack); API connects via env.  
- **Cloudflare R2** — external object storage.
