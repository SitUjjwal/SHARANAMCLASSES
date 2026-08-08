# syntax=docker/dockerfile:1.7
# Production image for @sharanam/api (Express) — monorepo-aware multi-stage build.

ARG NODE_VERSION=22

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

# Native deps sometimes needed by npm packages (keep slim)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .nvmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/tsconfig ./packages/tsconfig
COPY packages/eslint-config ./packages/eslint-config
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=@sharanam/api --workspace=@sharanam/shared --include-workspace-root

# ─── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm run build --workspace=@sharanam/shared \
  && npm run build --workspace=@sharanam/api

# ─── Production runner ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    APP_ENV=production \
    PORT=4000 \
    LOG_DIR=/app/logs \
    LOG_TO_CONSOLE=true \
    SHUTDOWN_TIMEOUT_MS=15000

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/logs \
  && chown -R node:node /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/tsconfig ./packages/tsconfig
COPY packages/eslint-config ./packages/eslint-config
COPY apps/api/package.json ./apps/api/

# Production node_modules only (no TypeScript / vitest / eslint)
RUN npm ci --omit=dev --workspace=@sharanam/api --workspace=@sharanam/shared --include-workspace-root \
  && npm cache clean --force

COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist

USER node
WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/server.js"]
