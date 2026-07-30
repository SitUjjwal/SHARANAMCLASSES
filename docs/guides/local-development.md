# Local Development Guide

## 1. Install

```bash
npm install
```

## 2. Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
```

Fill values from Supabase, Cloudflare R2, Razorpay, and Firebase consoles.

## 3. Shared package

```bash
npm run build:shared
```

## 4. Run apps

```bash
npm run dev:api      # http://localhost:4000
npm run dev:admin    # http://localhost:5173
npm run dev:mobile   # Expo Metro
```

## 5. Database

SQL migrations live in `infra/supabase/migrations`. Apply via Supabase CLI or dashboard when schema work begins.

## Notes

- This repository currently ships **architecture only** — domain features are not implemented yet.
- Prefer Node 20+ (see root `.nvmrc`).
