# Production readiness — SHARANAM CLASSES

This document is the **source of truth** for running Development, Staging, and Production safely.

Related:

- [Docs index + every-file map](./README.md)
- [Deployment strategy (hosts)](./strategy.md)
- [Expo prepare + AAB build](./expo-prepare.md)
- [Play Store listing assets](./play-store-assets.md)
- [Backend deploy (API + HTTPS)](./backend-deploy.md)
- [Admin deploy (React + HTTPS)](./admin-deploy.md)
- [Google Play (mobile)](./mobile-play-store.md)
- [Environment variables](./production-env.md)
- [Docker & CI/CD](./docker.md)
- [Testing checklist](./production-testing-checklist.md)
- [System ops API](../api/system-ops.md)
- [Logging](../api/logging.md)

---

## 1. Environment model

| Tier | `APP_ENV` | Typical `NODE_ENV` | Compose file | Images | Data |
|------|-----------|--------------------|--------------|--------|------|
| **Development** | `development` | `development` | `docker-compose.yml` | Built locally (`*:dev`) | Local / shared-dev Supabase OK |
| **Staging** | `staging` | `production` | `docker-compose.staging.yml` | GHCR `:staging` | **Separate** Supabase + R2 + Razorpay **test** |
| **Production** | `production` | `production` | `docker-compose.prod.yml` | GHCR `:latest` / `:sha7` | Live secrets only |

**`NODE_ENV` vs `APP_ENV`**

- `NODE_ENV` — Node/Express behaviour (optimizations, HTTPS enforce, rate limits).
- `APP_ENV` — which **deployment tier** you are on (shows in `/health`, `/ready`, and every log line).

Staging uses `NODE_ENV=production` (hardened runtime) with `APP_ENV=staging` (logs + docs say “staging”).

---

## 2. Health, ready, shutdown

| Probe | Path | Auth | Meaning | Use for |
|-------|------|------|---------|---------|
| **Liveness** | `GET /health` | Public | Process is up | Docker `HEALTHCHECK`, container restart |
| **Readiness** | `GET /ready` | Public | DB OK + not shutting down | Load balancer / reverse proxy |

**Graceful shutdown (API)**

1. `SIGTERM` / `SIGINT`
2. Mark not ready → `/ready` returns `503`
3. Stop reminder / backup / monitoring schedulers
4. `server.close()` — drain in-flight HTTP
5. Flush log streams
6. Exit `0` (or force exit after `SHUTDOWN_TIMEOUT_MS`, default 15s)

Compose sets `stop_grace_period` so Docker waits for this.

---

## 3. Environment validation

On boot (`apps/api/src/config/env.ts`):

1. Zod parses all env vars (fail → exit 1).
2. Alias map (e.g. `RAZORPAY_KEY` → `RAZORPAY_KEY_ID`).
3. If `APP_ENV` is `staging` or `production` (or `NODE_ENV=production` with non-dev tier), **strict secrets** required:
   - `SUPABASE_URL` (https `*.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (≥32, not default)
   - R2 fully configured
   - Razorpay key + secret

Development may boot with empty R2/Razorpay for local UI work.

---

## 4. Production logging

- JSON lines under `LOG_DIR` (`app-`, `error-`, `access-`), rotated daily / by size.
- Every entry includes `env` (`NODE_ENV`) and `app_env` (`APP_ENV`).
- Containers set `LOG_TO_CONSOLE=true` so Docker / journald capture stdout.
- Secrets fields are redacted (`password`, `token`, …).
- Request logger skips `/health` and `/ready` (noise).

See [logging.md](../api/logging.md).

---

## 5. How to run each tier

### Development (local)

```bash
# Preferred for coding
npm run dev:api
npm run dev:admin

# Or Docker
cp .env.docker.example .env
cp apps/api/.env.example apps/api/.env
# fill VITE_* and API secrets
docker compose -f docker-compose.yml up --build -d
```

- Admin: http://localhost:5173 (npm) or :8080 (compose)
- API: http://localhost:4000 — `GET /health`, `GET /ready`

### Staging

```bash
# On staging host
cp apps/api/.env.staging.example apps/api/.env   # fill staging secrets
export IMAGE_TAG=staging
export GITHUB_REPOSITORY_OWNER=<lowercase-gh-owner>
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
curl -fsS http://127.0.0.1:4000/ready
```

CI: push to `develop` → [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml)  
Enable remote deploy with repo variable `STAGING_DEPLOY_ENABLED=true` + staging secrets (below).

### Production

```bash
cp apps/api/.env.production.example apps/api/.env   # LIVE secrets
export IMAGE_TAG=<sha7>
export GITHUB_REPOSITORY_OWNER=<lowercase-gh-owner>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl -fsS http://127.0.0.1:4000/ready
```

CI: push to `main`/`master` → [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)  
Enable with `DEPLOY_ENABLED=true`.

---

## 6. File map (what each file does)

### Compose & Docker

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](../../docker-compose.yml) | **Development** stack — build local images, `APP_ENV=development` |
| [`docker-compose.staging.yml`](../../docker-compose.staging.yml) | **Staging** stack — pull `:staging` from GHCR, `APP_ENV=staging` |
| [`docker-compose.prod.yml`](../../docker-compose.prod.yml) | **Production** — API + Admin + **Caddy HTTPS** |
| [`docker-compose.backend.yml`](../../docker-compose.backend.yml) | **Backend-only** production — API + Caddy HTTPS |
| [`docker-compose.admin.yml`](../../docker-compose.admin.yml) | **Admin-only** production — SPA + Caddy HTTPS |
| [`infra/caddy/Caddyfile`](../../infra/caddy/Caddyfile) | TLS + reverse proxy (API + Admin) |
| [`infra/caddy/Caddyfile.backend`](../../infra/caddy/Caddyfile.backend) | TLS + reverse proxy (API only) |
| [`infra/caddy/Caddyfile.admin`](../../infra/caddy/Caddyfile.admin) | TLS + reverse proxy (Admin only) |
| [`.env.backend.example`](../../.env.backend.example) | Domains + ACME email for HTTPS deploy |
| [`.env.admin.example`](../../.env.admin.example) | Admin domain + `VITE_*` build env |
| [`docs/deployment/backend-deploy.md`](./backend-deploy.md) | Step-by-step backend deploy + requirement map |
| [`docs/deployment/admin-deploy.md`](./admin-deploy.md) | Step-by-step admin deploy + requirement map |
| [`apps/api/Dockerfile`](../../apps/api/Dockerfile) | Multi-stage API image; non-root; HEALTHCHECK `/health`; graceful stop via SIGTERM |
| [`apps/admin/Dockerfile`](../../apps/admin/Dockerfile) | Vite build → nginx SPA; fails if `VITE_SUPABASE_*` empty |
| [`apps/admin/nginx.conf`](../../apps/admin/nginx.conf) | SPA fallback, `/healthz`, gzip, security headers |
| [`Dockerfile`](../../Dockerfile) | Convenience root alias → same as API Dockerfile |
| [`.dockerignore`](../../.dockerignore) | Keeps secrets and heavy dirs out of build context |
| [`.env.docker.example`](../../.env.docker.example) | Root compose **interpolation** only (ports + `VITE_*`), not API secrets |

### Environment templates

| File | Purpose |
|------|---------|
| [`apps/api/.env.example`](../../apps/api/.env.example) | Local **development** API env |
| [`apps/api/.env.staging.example`](../../apps/api/.env.staging.example) | **Staging** API env (test keys, separate project) |
| [`apps/api/.env.production.example`](../../apps/api/.env.production.example) | **Production** API env (live keys) |
| [`apps/admin/.env.example`](../../apps/admin/.env.example) | Local Vite admin env |
| [`apps/mobile/.env.example`](../../apps/mobile/.env.example) | Mobile + `EXPO_PUBLIC_APP_ENV` |

### API runtime (health / env / shutdown / logs)

| File | Purpose |
|------|---------|
| [`apps/api/src/config/env.ts`](../../apps/api/src/config/env.ts) | Zod schema, aliases, `APP_ENV`, deployed-tier secret assert |
| [`apps/api/src/config/lifecycle.ts`](../../apps/api/src/config/lifecycle.ts) | Accepting-traffic flag for `/ready` during shutdown |
| [`apps/api/src/controllers/health.controller.ts`](../../apps/api/src/controllers/health.controller.ts) | `GET /health` + `GET /ready` handlers |
| [`apps/api/src/routes/health.routes.ts`](../../apps/api/src/routes/health.routes.ts) | Mounts health + ready routers |
| [`apps/api/src/routes/index.ts`](../../apps/api/src/routes/index.ts) | Registers `/health` and `/ready` publicly |
| [`apps/api/src/server.ts`](../../apps/api/src/server.ts) | Listen + start jobs + **graceful shutdown** |
| [`apps/api/src/logging/logger.ts`](../../apps/api/src/logging/logger.ts) | Structured JSON logs + `app_env` + `closeLogger()` |
| [`apps/api/src/logging/requestLogger.ts`](../../apps/api/src/logging/requestLogger.ts) | Access logs; skips probes |
| [`apps/api/src/middlewares/rateLimiter.ts`](../../apps/api/src/middlewares/rateLimiter.ts) | Skips `/health` and `/ready` |
| [`apps/api/src/jobs/*/scheduler.ts`](../../apps/api/src/jobs) | Cron jobs with `stop*` used on shutdown |
| [`apps/api/src/monitoring/systemSampler.ts`](../../apps/api/src/monitoring/systemSampler.ts) | Metrics sampler; stopped on shutdown |

### CI/CD

| File | Purpose |
|------|---------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Lint, typecheck, tests, build, Docker smoke |
| [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) | Prod GHCR push + optional SSH (`docker-compose.prod.yml`) |
| [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) | Staging GHCR push (`:staging`) + optional SSH |

### Docs

| File | Purpose |
|------|---------|
| **This file** | Production readiness overview + file explanations |
| [`production-env.md`](./production-env.md) | Canonical env names and aliases |
| [`docker.md`](./docker.md) | Docker day-2 ops |
| [`production-testing-checklist.md`](./production-testing-checklist.md) | Sign-off checklist |

---

## 7. GitHub secrets / variables

### Production (`deploy.yml`)

| Name | Type | Role |
|------|------|------|
| `VITE_API_BASE_URL`, `VITE_SUPABASE_*`, `VITE_RAZORPAY_KEY_ID` | Secret | Baked into admin image |
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` | Secret | SSH deploy |
| `DEPLOY_PORT` | Secret (optional) | Default 22 |
| `GHCR_PULL_TOKEN` | Secret (optional) | Pull on private packages |
| `DEPLOY_ENABLED` | Variable | `true` to auto-deploy on push |

### Staging (`deploy-staging.yml`)

| Name | Type | Role |
|------|------|------|
| `STAGING_VITE_*` | Secret | Staging admin bake-time env |
| `STAGING_DEPLOY_HOST`, `_USER`, `_SSH_KEY`, `_PATH` | Secret | Staging SSH |
| `STAGING_DEPLOY_PORT` | Secret (optional) | Default 22 |
| `STAGING_DEPLOY_ENABLED` | Variable | `true` to auto-deploy `develop` |

---

## 8. Probe examples

```bash
# Liveness
curl -s http://localhost:4000/health
# {"status":"ok","app_env":"production","node_env":"production","uptime_s":123}

# Readiness (503 if DB down or shutting down)
curl -s http://localhost:4000/ready
# {"status":"ready","app_env":"production","checks":{"database":"ok"}}
```

Admin container: `GET /healthz` (nginx).

---

## 9. Hard rules

1. Never commit real `.env` files.
2. Never reuse production Supabase / Razorpay live keys on staging.
3. Rebuild admin when any `VITE_*` value changes (baked at build time).
4. Put TLS at the edge (Cloudflare / Caddy / nginx); compose exposes plain HTTP ports.
5. Point LB **readiness** at `/ready`, **liveness** at `/health`.
6. After deploy, confirm `curl /ready` returns 200 before cutting traffic.
