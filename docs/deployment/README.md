# Deployment docs — SHARANAM CLASSES (production-ready)

This folder is the production handbook. The API is **production-ready** for Dev / Staging / Prod with env validation, logging, health/ready probes, and graceful shutdown.

**Host strategy (Railway, Pages, EAS, Supabase, R2):** [strategy.md](./strategy.md)  
**Go-live gate (Backend → Play):** [launch-checklist.md](./launch-checklist.md)  
**You do this (click-by-click):** [how-to-legal-and-play.md](./how-to-legal-and-play.md)  
**Version management (SemVer / force update):** [version-management.md](./version-management.md)  
**Feature testing (Mobile / Backend / Admin / Security):** [testing-checklist.md](./testing-checklist.md)

---

## Requirement checklist

| Task | Status | Where |
|------|--------|--------|
| Separate **Development** | Done | `docker-compose.yml` · `APP_ENV=development` · `apps/api/.env.example` |
| Separate **Staging** | Done | `docker-compose.staging.yml` · `APP_ENV=staging` · `.env.staging.example` · `deploy-staging.yml` |
| Separate **Production** | Done | `docker-compose.prod.yml` · `APP_ENV=production` · `.env.production.example` · `deploy.yml` |
| **Environment variables** | Done | Zod + aliases in `apps/api/src/config/env.ts` · templates below |
| **Production logging** | Done | JSON rotating files + `app_env` · `LOG_TO_CONSOLE` in containers |
| **Health checks** | Done | Public `GET /health` · Docker `HEALTHCHECK` |
| **Ready checks** | Done | Public `GET /ready` (DB + not shutting down) |
| **Graceful shutdown** | Done | SIGTERM/SIGINT → `/ready` 503 → stop jobs → `server.close` → flush logs |
| **Environment validation** | Done | Zod parse fail → exit 1; staging/prod secret assert → exit 1 |
| **Production documentation** | Done | This folder (see file map) |

---

## How the three environments differ

| | Development | Staging | Production |
|--|-------------|---------|------------|
| Compose | `docker-compose.yml` | `docker-compose.staging.yml` | `docker-compose.prod.yml` |
| `APP_ENV` | `development` | `staging` | `production` |
| `NODE_ENV` | `development` | `production` | `production` |
| Images | Build local (`*:dev`) | GHCR `:staging` | GHCR `:sha` / `:latest` |
| Secrets template | `.env.example` | `.env.staging.example` | `.env.production.example` |
| Data | Local / shared OK | **Separate** Supabase, R2, Razorpay **test** | Live only |
| CI deploy | — | `develop` → `deploy-staging.yml` | `main`/`master` → `deploy.yml` |

Local coding without Docker: `npm run dev:api` + `npm run dev:admin` + `npm run dev:mobile`.

---

## Probes (copy for load balancers)

```bash
curl -fsS https://api.yourdomain.com/health
# {"status":"ok","app_env":"production","node_env":"production","uptime_s":…}

curl -fsS https://api.yourdomain.com/ready
# {"status":"ready","checks":{"database":"ok"}}   # or 503 if DB down / shutting down

curl -fsS https://api.yourdomain.com/version
# {"success":true,"data":{"version":"1.0.0","android_build_number":1,…}}

curl -fsS https://api.yourdomain.com/release-notes
# {"success":true,"data":{"version":"1.0.0","release_notes":"…","history":[…]}}
```

| Probe | Path | Use |
|-------|------|-----|
| Liveness | `/health` | Container restart / “process up?” |
| Readiness | `/ready` | Stop sending traffic if DB down or draining |

---

## Explain every important file

### Compose & Docker

| File | What it does |
|------|----------------|
| [`docker-compose.yml`](../../docker-compose.yml) | **Dev** stack: build API+admin locally, `APP_ENV=development`, auto-restart, healthcheck |
| [`docker-compose.staging.yml`](../../docker-compose.staging.yml) | **Staging**: pull GHCR staging images, `APP_ENV=staging` |
| [`docker-compose.prod.yml`](../../docker-compose.prod.yml) | **Production**: API + Admin + **Caddy HTTPS**, `APP_ENV=production` |
| [`docker-compose.backend.yml`](../../docker-compose.backend.yml) | Production **API-only** + Caddy (no admin) |
| [`docker-compose.admin.yml`](../../docker-compose.admin.yml) | Production **Admin-only** + Caddy |
| [`apps/api/Dockerfile`](../../apps/api/Dockerfile) | Multi-stage API image; non-root; `HEALTHCHECK /health`; SIGTERM-friendly |
| [`apps/admin/Dockerfile`](../../apps/admin/Dockerfile) | Vite build → nginx; fails if `VITE_SUPABASE_*` empty |
| [`apps/admin/nginx.conf`](../../apps/admin/nginx.conf) | SPA fallback, asset caching, gzip, static error pages, security headers |
| [`Dockerfile`](../../Dockerfile) | Root convenience alias → same as API Dockerfile |
| [`.dockerignore`](../../.dockerignore) | Keeps secrets and junk out of image build context |
| [`infra/caddy/Caddyfile`](../../infra/caddy/Caddyfile) | TLS for API + Admin domains |
| [`infra/caddy/Caddyfile.backend`](../../infra/caddy/Caddyfile.backend) | TLS for API only |
| [`infra/caddy/Caddyfile.admin`](../../infra/caddy/Caddyfile.admin) | TLS for Admin only |

### Environment templates

| File | What it does |
|------|----------------|
| [`apps/api/.env.example`](../../apps/api/.env.example) | Local **development** API secrets template |
| [`apps/api/.env.staging.example`](../../apps/api/.env.staging.example) | **Staging** API template (test keys, separate project) |
| [`apps/api/.env.production.example`](../../apps/api/.env.production.example) | **Production** API template (live keys) |
| [`.env.docker.example`](../../.env.docker.example) | Root compose interpolation (ports + `VITE_*` for local Docker admin build) |
| [`.env.backend.example`](../../.env.backend.example) | Domains + ACME email for HTTPS (Caddy) |
| [`.env.admin.example`](../../.env.admin.example) | Admin domain + `VITE_*` for admin-only deploy |
| [`apps/admin/.env.example`](../../apps/admin/.env.example) | Local Vite admin env |
| [`apps/mobile/.env.example`](../../apps/mobile/.env.example) | Expo public env + EAS project id |

### API runtime (validation, health, shutdown, logs)

| File | What it does |
|------|----------------|
| [`apps/api/src/config/env.ts`](../../apps/api/src/config/env.ts) | Zod schema, env aliases, `APP_ENV`, **fail-fast secret checks** for staging/prod |
| [`apps/api/src/config/lifecycle.ts`](../../apps/api/src/config/lifecycle.ts) | Accepting-traffic flag used by `/ready` during shutdown |
| [`apps/api/src/controllers/health.controller.ts`](../../apps/api/src/controllers/health.controller.ts) | Handlers for `/health` and `/ready` |
| [`apps/api/src/routes/health.routes.ts`](../../apps/api/src/routes/health.routes.ts) | Routers for health + ready |
| [`apps/api/src/routes/index.ts`](../../apps/api/src/routes/index.ts) | Mounts `/health` and `/ready` publicly |
| [`apps/api/src/server.ts`](../../apps/api/src/server.ts) | Listen, start schedulers, **graceful shutdown** |
| [`apps/api/src/logging/logger.ts`](../../apps/api/src/logging/logger.ts) | Structured JSON logs (`env` + `app_env`), rotation, `closeLogger()` |
| [`apps/api/src/logging/requestLogger.ts`](../../apps/api/src/logging/requestLogger.ts) | Access logs; skips `/health` and `/ready` |
| [`apps/api/src/middlewares/rateLimiter.ts`](../../apps/api/src/middlewares/rateLimiter.ts) | Skips probes so health checks are not rate-limited |
| [`apps/api/src/middlewares/enforceHttps.ts`](../../apps/api/src/middlewares/enforceHttps.ts) | Rejects cleartext when proxy sends `X-Forwarded-Proto: http` |
| [`apps/api/src/middlewares/secureHeaders.ts`](../../apps/api/src/middlewares/secureHeaders.ts) | Helmet + HSTS / nosniff / frame deny |
| [`apps/api/src/app.ts`](../../apps/api/src/app.ts) | Middleware order: headers → HTTPS → **compression** → CORS → logs → routes |

### CI/CD

| File | What it does |
|------|----------------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Lint, typecheck, tests, build, Docker smoke |
| [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) | Prod images → GHCR → optional SSH + `docker-compose.prod.yml` |
| [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) | Staging images (`:staging`) → optional SSH |

### Mobile (Play)

| File | What it does |
|------|----------------|
| [`apps/mobile/eas.json`](../../apps/mobile/eas.json) | EAS profiles: preview APK, production **AAB** |
| [`apps/mobile/app.config.js`](../../apps/mobile/app.config.js) | Expo SDK 54 config, `versionCode`, package id |

### Docs in this folder

| File | What it does |
|------|----------------|
| **This file** (`README.md`) | Production checklist + explain-every-file index |
| [`strategy.md`](./strategy.md) | Host strategy: Railway/Render, Pages, EAS, Supabase, R2 |
| [`launch-checklist.md`](./launch-checklist.md) | Full launch checklist with explanations (API, DB, R2, Firebase, payments, admin, Android, security, testing) |
| [`production.md`](./production.md) | Multi-env ops deep dive |
| [`production-env.md`](./production-env.md) | Canonical env names + aliases |
| [`backend-deploy.md`](./backend-deploy.md) | Deploy API with Docker + HTTPS |
| [`admin-deploy.md`](./admin-deploy.md) | Deploy admin SPA |
| [`mobile-play-store.md`](./mobile-play-store.md) | Google Play / EAS AAB steps |
| [`docker.md`](./docker.md) | Docker & CI day-2 reference |
| [`production-testing-checklist.md`](./production-testing-checklist.md) | Sign-off checklist |

---

## Quick verify (local API)

```bash
npm run dev:api
curl -fsS http://127.0.0.1:4000/health
curl -fsS http://127.0.0.1:4000/ready
```

## Quick verify (Docker production-shaped)

```bash
cp apps/api/.env.production.example apps/api/.env   # fill secrets
cp .env.backend.example .env                        # API_DOMAIN, ACME_EMAIL
docker compose -f docker-compose.backend.yml up -d --build
curl -fsS https://$API_DOMAIN/ready
```

---

## Production-ready verdict

**Yes — the platform is production-ready** for:

- Separated Dev / Staging / Prod configs  
- Validated env + fail-fast secrets  
- Structured production logging  
- Liveness + readiness  
- Graceful shutdown  
- Documented file map and deploy guides  

**Still your ops choices (not code gaps):** pick hosts ([strategy.md](./strategy.md)), fill live secrets, DNS/TLS, Play Console listing, privacy URL.
