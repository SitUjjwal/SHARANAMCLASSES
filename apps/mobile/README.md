# @sharanam/mobile

Expo SDK 54 · React Native · TypeScript student app for SHARANAM CLASSES.

## Stack

- React Navigation (native stack)
- React Native Screens / Safe Area / Gesture Handler / Reanimated
- Axios · TanStack React Query · Zustand · React Hook Form
- ESLint · Prettier · TypeScript
- `EXPO_PUBLIC_*` environment variables

## Structure

```
App.tsx
index.ts
assets/
src/
  api/           # Axios client + React Query
  components/
  constants/     # Includes env.ts
  hooks/
  navigation/
  screens/
  services/
  store/         # Zustand
  theme/
  types/
  utils/
```

## Scripts

```bash
npm start
npm run lint
npm run format
npm run typecheck
```

Copy `.env.example` → `.env` before running.
