# Backend deployment — SHARANAM CLASSES API

Deploy the Express API with **Docker**, **HTTPS (Caddy)**, env validation, health checks, automatic restart, compression, security headers, and structured logging.

Full multi-env guide: [`production.md`](./production.md).

---

## What you get

| Requirement | How it is satisfied |
|-------------|---------------------|
| **Docker** | `apps/api/Dockerfile` + `docker-compose.backend.yml` (API only) or `docker-compose.prod.yml` (API + admin + Caddy) |
| **HTTPS** | Caddy on `:443` with Let's Encrypt; API stays HTTP on the internal Docker network |
| **Environment variables** | `apps/api/.env` (`env_file`) + Zod validation + production secret assert |
| **Health check** | `GET /health` (liveness) · Docker `HEALTHCHECK` · `GET /ready` (DB readiness) |
| **Automatic restart** | `restart: unless-stopped` on API + Caddy |
| **Compression** | Express `compression` middleware + Caddy `encode gzip zstd` |
| **Security headers** | Helmet + extras in Express; HSTS / nosniff / frame deny also at Caddy edge |
| **Logging** | JSON rotating files under `/app/logs` + stdout (`LOG_TO_CONSOLE=true`); Caddy access logs JSON to stdout |

---

## Architecture

```
Internet
   │
   ▼
Caddy :80/:443  ──TLS──►  api:4000  (Express)
   │                         │
   │                         ├─ Helmet, HTTPS enforce (X-Forwarded-Proto)
   │                         ├─ gzip compression
   │                         ├─ rate limit, CORS, sanitize
   │                         └─ /health · /ready · business routes
   │
   └── (prod compose) ──► admin:80  (nginx SPA)
```

Public clients only talk to **HTTPS**. The API port is bound to `127.0.0.1:4000` on the host for local ops (`curl http://127.0.0.1:4000/ready`), not for the public internet.

---

## Files used for backend deploy

| File | Role |
|------|------|
| [`apps/api/Dockerfile`](../../apps/api/Dockerfile) | Production API image (non-root, `HEALTHCHECK /health`) |
| [`docker-compose.backend.yml`](../../docker-compose.backend.yml) | **Backend-only**: API + Caddy |
| [`docker-compose.prod.yml`](../../docker-compose.prod.yml) | Full prod: API + Admin + Caddy |
| [`infra/caddy/Caddyfile.backend`](../../infra/caddy/Caddyfile.backend) | TLS + reverse proxy for API only |
| [`infra/caddy/Caddyfile`](../../infra/caddy/Caddyfile) | TLS for API + Admin |
| [`.env.backend.example`](../../.env.backend.example) | Domains, ACME email, image tags |
| [`apps/api/.env.production.example`](../../apps/api/.env.production.example) | API secrets template |
| [`apps/api/src/app.ts`](../../apps/api/src/app.ts) | Compression + security middleware stack |
| [`apps/api/src/middlewares/secureHeaders.ts`](../../apps/api/src/middlewares/secureHeaders.ts) | Helmet / HSTS / nosniff |
| [`apps/api/src/middlewares/enforceHttps.ts`](../../apps/api/src/middlewares/enforceHttps.ts) | Rejects `X-Forwarded-Proto: http` in production |
| [`apps/api/src/server.ts`](../../apps/api/src/server.ts) | Listen + graceful shutdown |
| [`apps/api/src/logging/`](../../apps/api/src/logging) | Structured JSON logging |

---

## Deploy steps (backend only)

### 1. Server prerequisites

- Docker Engine + Compose plugin
- Domain `API_DOMAIN` DNS **A/AAAA** → server IP
- Firewall: allow **80** and **443** (and SSH)

### 2. Configure secrets

```bash
cd /path/to/SHARANAM-CLASSES

cp apps/api/.env.production.example apps/api/.env
# Edit apps/api/.env — Supabase, JWT (≥32), R2, Razorpay live, CORS, API_BASE_URL=https://api…

cp .env.backend.example .env
# Edit .env — API_DOMAIN, ACME_EMAIL, IMAGE_TAG, GITHUB_REPOSITORY_OWNER
```

Important `apps/api/.env` values:

```env
NODE_ENV=production
APP_ENV=production
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://admin.yourdomain.com   # or mobile/web origins
LOG_TO_CONSOLE=true
LOG_DIR=/app/logs
```

### 3. Start

**Build on the server:**

```bash
docker compose -f docker-compose.backend.yml up -d --build
```

**Or pull from GHCR** (after CI push):

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u USER --password-stdin
export IMAGE_TAG=<sha7-or-latest>
export GITHUB_REPOSITORY_OWNER=<lowercase-owner>
docker compose -f docker-compose.backend.yml pull
docker compose -f docker-compose.backend.yml up -d
```

### 4. Verify

```bash
# Docker liveness (inside / loopback)
curl -fsS http://127.0.0.1:4000/health
curl -fsS http://127.0.0.1:4000/ready

# Public HTTPS
curl -fsS https://api.yourdomain.com/health
curl -fsS https://api.yourdomain.com/ready

docker compose -f docker-compose.backend.yml ps
docker compose -f docker-compose.backend.yml logs -f api caddy
```

Expect `/health` → `200` with `"status":"ok"`.  
Expect `/ready` → `200` with `"checks":{"database":"ok"}` (503 if Supabase down).

### 5. Automatic restart behaviour

- `restart: unless-stopped` — container comes back after crash or reboot
- Unhealthy API (failed `/health`) is reported by Docker; pair with your monitor on `/ready`
- `stop_grace_period: 30s` — allows graceful SIGTERM shutdown (drain HTTP, stop jobs)

---

## Requirement deep-dive

### Docker

Multi-stage image builds shared + API TypeScript, runs `node dist/server.js` as user `node`. Logs volume persists `/app/logs`.

### HTTPS

Caddy obtains and renews certificates automatically. It sets `X-Forwarded-Proto: https` so Express can enforce TLS for proxied clients without breaking internal healthchecks.

### Environment variables

Validated at boot (`env.ts`). Missing production secrets → process **exits** (fail fast). Never commit real `.env`.

### Health check

| Probe | Path | Use |
|-------|------|-----|
| Liveness | `/health` | Docker HEALTHCHECK, “is process up?” |
| Readiness | `/ready` | LB / uptime monitors, “can serve traffic?” |

### Compression

Responses ≥1KB are gzip’d by Express; Caddy also encodes gzip/zstd at the edge.

### Security headers

Express (Helmet): HSTS (prod), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Permissions-Policy, no `X-Powered-By`.  
Caddy repeats HSTS/nosniff/frame deny and strips `Server`.

### Logging

| Stream | Content |
|--------|---------|
| `app-*.log` | All levels |
| `error-*.log` | Errors |
| `access-*.log` | API requests |
| Container stdout | Same when `LOG_TO_CONSOLE=true` (default in compose) |
| Caddy stdout | Edge access JSON |

---

## Full stack (API + Admin + HTTPS)

```bash
docker compose -f docker-compose.prod.yml up -d
```

Admin image must be built with production `VITE_*` (CI secrets). See [`docker.md`](./docker.md).

---

## Ops cheat sheet

```bash
# Restart API only
docker compose -f docker-compose.backend.yml restart api

# Tail logs
docker compose -f docker-compose.backend.yml logs -f --tail=200 api

# Rolling image update
export IMAGE_TAG=newsha
docker compose -f docker-compose.backend.yml pull api
docker compose -f docker-compose.backend.yml up -d api
```

After deploy, always confirm **`https://$API_DOMAIN/ready`** returns 200 before routing user traffic.
