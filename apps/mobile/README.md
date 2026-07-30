# @sharanam/mobile

Expo SDK 54 student application for SHARANAM CLASSES.

## Structure

```
app/                 # Expo Router screens & layouts
src/
  components/        # Reusable UI & shared components
  features/          # Domain modules (auth, courses, payments, …)
  hooks/             # Shared React hooks
  services/          # API / Supabase / FCM clients
  store/             # Client state
  theme/             # Design tokens
  constants/         # App constants
  utils/             # Helpers
assets/              # Images & fonts
```

## Scripts

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` — platform targets
- `npm run typecheck` — TypeScript check
