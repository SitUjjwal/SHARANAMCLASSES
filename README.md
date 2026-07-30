# SHARANAM CLASSES

Enterprise learning platform monorepo — student mobile app, admin panel, and API.

## Architecture Overview

```
sharanam-classes/
├── apps/
│   ├── mobile/          # Expo SDK 54 · React Native · TypeScript (students)
│   ├── admin/           # React · Vite · TypeScript (operations)
│   └── api/             # Node.js · Express · TypeScript (backend)
├── packages/
│   ├── shared/          # Shared types, schemas, constants
│   ├── tsconfig/        # Shared TypeScript base configs
│   └── eslint-config/   # Shared ESLint presets
├── infra/
│   └── supabase/        # Migrations, seed data
├── docs/                # Architecture, ADRs, guides
└── .github/workflows/   # CI placeholders
```

## Technology Stack

| Layer | Technology |
| --- | --- |
| Mobile | Expo SDK 54, React Native, TypeScript |
| Admin | React, Vite, TypeScript |
| API | Node.js, Express.js, TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Cloudflare R2 |
| Payments | Razorpay |
| Notifications | Firebase Cloud Messaging (FCM) |
| Videos | YouTube Unlisted |

## Design Principles

- **Monorepo** — single source of truth; apps share typed contracts via `@sharanam/shared`
- **Layered API** — routes → controllers → services → repositories → integrations
- **Feature-oriented clients** — mobile & admin organized by domain features
- **Integration isolation** — Supabase, R2, Razorpay, FCM, YouTube behind dedicated modules
- **No business logic in UI** — clients call the API; shared types keep contracts aligned

## Apps

### `apps/mobile` — Student App

Expo Router app for learners: auth, course catalog, enrolled content, YouTube video playback, Razorpay checkout, and FCM push notifications.

### `apps/admin` — Admin Panel

Vite SPA for staff: student management, course/content publishing, payment oversight, and notification campaigns.

### `apps/api` — Backend API

Express service exposing REST endpoints. Owns business rules, webhook handling (Razorpay), signed R2 uploads, FCM dispatch, and Supabase data access.

## Packages

| Package | Name | Purpose |
| --- | --- | --- |
| `packages/shared` | `@sharanam/shared` | DTOs, enums, Zod schemas, API contracts |
| `packages/tsconfig` | `@sharanam/tsconfig` | Base `tsconfig` presets |
| `packages/eslint-config` | `@sharanam/eslint-config` | Shared lint rules |

## Prerequisites

- Node.js **20+** (see `.nvmrc`)
- npm **10+**
- Expo CLI / EAS (mobile)
- Supabase project
- Cloudflare R2 bucket
- Razorpay account
- Firebase project (FCM)

## Getting Started

```bash
# Install all workspace dependencies
npm install

# Copy environment templates (fill in secrets locally)
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env

# Build shared package first
npm run build:shared

# Run services (separate terminals)
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

> Feature implementation is intentionally out of scope for this scaffold. Packages and entrypoints are stubs ready for development.

## Scripts (root)

| Script | Description |
| --- | --- |
| `npm run dev:api` | Start API in watch mode |
| `npm run dev:admin` | Start admin Vite dev server |
| `npm run dev:mobile` | Start Expo |
| `npm run build` | Build all packages/apps that define `build` |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run test` | Run workspace tests |

## Environment Variables

See each app's `.env.example`. Never commit real secrets. High-level map:

| Concern | Where configured |
| --- | --- |
| Supabase URL / keys | `api`, `mobile`, `admin` |
| R2 credentials | `api` only |
| Razorpay keys | `api` (+ public key on clients) |
| FCM credentials | `api` (+ client push config on `mobile`) |
| YouTube API | `api` (optional metadata) |

## Documentation

| Doc | Path |
| --- | --- |
| System architecture | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Folder conventions | [`docs/architecture/folder-structure.md`](docs/architecture/folder-structure.md) |
| API conventions | [`docs/api/conventions.md`](docs/api/conventions.md) |
| Local setup | [`docs/guides/local-development.md`](docs/guides/local-development.md) |
| ADRs | [`docs/adr/`](docs/adr/) |

## License

Proprietary — SHARANAM CLASSES. All rights reserved.
