# System Architecture Overview

## Context

SHARANAM CLASSES is a multi-surface learning platform:

- **Mobile app** (`apps/mobile`) — students enroll, watch YouTube unlisted lessons, pay via Razorpay, receive FCM pushes
- **Admin panel** (`apps/admin`) — staff manage students, courses, content, payments, and notifications
- **API** (`apps/api`) — authoritative business logic and third-party orchestration

## High-Level Diagram

```
┌─────────────┐     ┌─────────────┐
│   Mobile    │     │    Admin    │
│  (Expo RN)  │     │ (React/Vite)│
└──────┬──────┘     └──────┬──────┘
       │                   │
       │   HTTPS / JSON    │
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │  @sharanam/api │
         │   (Express)    │
         └───────┬───────┘
                 │
     ┌───────────┼───────────────────────┐
     ▼           ▼           ▼           ▼
 Supabase     Cloudflare   Razorpay     FCM
 Auth + PG        R2       Payments   Push
     │
     └──── YouTube Unlisted (playback on clients)
```

## Bounded Contexts (planned)

| Context | Owns |
| --- | --- |
| Identity | Supabase Auth, roles, sessions |
| Catalog | Courses, modules, lessons, YouTube video IDs |
| Enrollment | Access grants, progress |
| Commerce | Razorpay orders, webhooks, receipts |
| Media | R2 uploads (thumbnails, PDFs, assets) |
| Messaging | FCM device tokens, campaigns |

## Trust Boundaries

- Clients never hold service-role keys, R2 secrets, or Razorpay webhook secrets
- API validates Supabase JWTs for protected routes
- Admin routes additionally require elevated roles
- Razorpay webhooks verified via signature before state changes
- R2 access via short-lived signed URLs issued by API

## Shared Contracts

`@sharanam/shared` is the single package for DTOs, enums, and Zod schemas consumed by all three apps. Breaking API changes must update shared types in the same PR.
