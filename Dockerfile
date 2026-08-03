# syntax=docker/dockerfile:1.7
# Default `docker build .` target — production API image.
# Admin SPA: docker build -f apps/admin/Dockerfile …
# See docs/deployment/docker.md

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

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

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm run build --workspace=@sharanam/shared \
  && npm run build --workspace=@sharanam/api

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    LOG_DIR=/app/logs \
    LOG_TO_CONSOLE=true

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
