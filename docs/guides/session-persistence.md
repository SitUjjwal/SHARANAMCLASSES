# How session persistence works (SHARANAM CLASSES mobile)

## Pieces

| Piece | Role |
| --- | --- |
| `src/auth/secureStorage.ts` | Expo SecureStore adapter (encrypted Keychain/Keystore) |
| `src/auth/supabase.ts` | `persistSession: true`, `autoRefreshToken: true`, custom storage |
| `src/auth/AuthProvider.tsx` | Restore on launch + `onAuthStateChange` → Zustand |
| `src/store/authStore.ts` | `status` / `session` / `user` for UI + redirects |
| `src/navigation/RootNavigator.tsx` | Auto redirect by `status` |

## Lifecycle

### 1. Login
1. `loginWithEmail` → `supabase.auth.signInWithPassword`
2. Supabase receives tokens and **writes session JSON** into SecureStore via `secureStorageAdapter.setItem`
3. `onAuthStateChange('SIGNED_IN')` fires
4. `AuthProvider` calls `setSession(session)` in Zustand
5. `RootNavigator` sees `authenticated` → shows **Home**

### 2. App killed / relaunched
1. App starts with Zustand `status: 'loading'` → **LoadingScreen**
2. `AuthProvider.restoreSessionOnLaunch()` calls `supabase.auth.getSession()`
3. supabase-js reads SecureStore (`getItem`) and rebuilds the session
4. Zustand updated → if session valid → **Home**, else → **Login**

### 3. Token refresh
- While app is open, supabase-js refreshes the access token
- Event: `TOKEN_REFRESHED`
- New tokens saved again to SecureStore + Zustand updated

### 4. Logout
1. `supabase.auth.signOut()`
2. SecureStore session keys removed
3. Event: `SIGNED_OUT`
4. Zustand reset → **Login**

## Security note
Sessions are stored with **Expo SecureStore** (not plain AsyncStorage), chunked to respect platform size limits.
