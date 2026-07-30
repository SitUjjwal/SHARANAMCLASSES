# Module 2 — Authentication Walkthrough

## Folders created / used

| Folder | Why |
| --- | --- |
| `src/auth/` | Supabase client, secure storage, schemas, AuthProvider |
| `src/hooks/` | `useAuth` + React Query auth mutations |
| `src/store/` | Zustand `authStore` for session status |
| `src/services/` | `auth.service.ts` wraps Supabase Auth APIs |
| `src/screens/` | Loading, Login, Register, Forgot Password (+ temp authenticated placeholder) |
| `src/components/ui/` | Reusable `Screen`, `AppButton`, `AppTextField`, `ErrorMessage` |
| `src/navigation/` | `AuthNavigator`, `AppNavigator`, protected `RootNavigator` |

## Dependencies added

| Package | Why |
| --- | --- |
| `@supabase/supabase-js` | Email auth (signUp / signIn / reset / signOut) |
| `expo-secure-store` | Persist session tokens in Keychain/Keystore |
| `zod` | Form + schema validation |
| `@hookform/resolvers` | Connect Zod ↔ React Hook Form |
| (already present) React Query, Zustand, React Hook Form | Mutations, session store, forms |

## How it works

1. App boots → `AuthProvider` calls `getSession()` (from SecureStore) and subscribes to `onAuthStateChange`.
2. Zustand `status`: `loading` → `authenticated` | `unauthenticated`.
3. `RootNavigator`:
   - `loading` → `LoadingScreen`
   - `unauthenticated` → Auth stack (Login / Register / Forgot Password)
   - `authenticated` → App stack (placeholder until Home module)
4. Forms use React Hook Form + Zod; mutations call `auth.service` → Supabase.
5. Logout clears Supabase session → store updates → Auth stack shown.

## Future modules

- Home tabs replace `AuthenticatedPlaceholderScreen`
- Attach access token to Axios for protected API routes
- Profiles table after register
- Deep link for password recovery

## Screens (as requested)

- Login
- Register
- Forgot Password
- Loading

Home screen was **not** built in this module.
