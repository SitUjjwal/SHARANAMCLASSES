# @sharanam/api

Express + TypeScript backend for SHARANAM CLASSES.

## Layering

```
routes → middleware → controllers → services → repositories → integrations
```

| Layer | Responsibility |
| --- | --- |
| `routes` | Path mounting, HTTP method binding |
| `middleware` | Auth, admin guards, validation, errors |
| `controllers` | Request/response mapping |
| `services` | Business rules & orchestration |
| `repositories` | Supabase / SQL persistence |
| `integrations` | Supabase, R2, Razorpay, FCM, YouTube |
| `jobs` | Async / scheduled work |
| `config` | Env & app configuration |

## Scripts

- `npm run dev` — watch mode via `tsx`
- `npm run build` — compile to `dist/`
- `npm start` — run compiled server
- `npm run typecheck` — `tsc --noEmit`
