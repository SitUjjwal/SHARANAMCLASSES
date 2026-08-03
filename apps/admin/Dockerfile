# syntax=docker/dockerfile:1.7
# Production image for @sharanam/admin (Vite SPA → nginx).

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json .nvmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/tsconfig ./packages/tsconfig
COPY packages/eslint-config ./packages/eslint-config
COPY packages/shared ./packages/shared
COPY apps/admin/package.json ./apps/admin/

RUN npm ci --workspace=@sharanam/admin --workspace=@sharanam/shared --include-workspace-root

COPY apps/admin ./apps/admin

# Vite inlines VITE_* at build time — pass via --build-arg / compose args.
# Empty Supabase URL/key → blank white page in the browser; fail the build instead.
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_RAZORPAY_KEY_ID=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then \
      echo "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set as build-args (see root .env)." >&2; \
      exit 1; \
    fi \
  && npm run build --workspace=@sharanam/shared \
  && npm run build --workspace=@sharanam/admin

# ─── Static nginx ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
