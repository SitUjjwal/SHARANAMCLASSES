# Expo app prepare + Android AAB build

Prepare `apps/mobile` for store release and explain how the **Android App Bundle (`.aab`)** is produced.

Related: [mobile-play-store.md](./mobile-play-store.md) · [strategy.md](./strategy.md)

---

## Requirements map

| Requirement | Status | Where |
|-------------|--------|--------|
| **Production config** | Ready | `app.config.js` + `eas.json` profile `production` + `EXPO_PUBLIC_*` |
| **Splash screen** | Ready | `assets/splash-brand.png` + `expo-splash-screen` plugin (`#0A3D2E`) |
| **Adaptive icon** | Ready | `assets/adaptive-icon.png` + `android.adaptiveIcon` bg `#0B1F3A` |
| **Notification icon** | Ready | `assets/notification-icon.png` (white + transparent) in `expo-notifications` |
| **App version** | Ready | `version: "1.0.0"` (user-facing) |
| **Build number** | Ready | Android `versionCode: 1` · iOS `buildNumber: "1"` |
| **Permissions** | Ready | Explicit Android list + iOS usage strings + image-picker / notifications plugins |
| **Generate AAB** | Command | `npm run build:android:production` → EAS → `.aab` |

---

## Files

| File | Role |
|------|------|
| [`apps/mobile/app.config.js`](../../apps/mobile/app.config.js) | Name, package, version, icons, splash, permissions, plugins |
| [`apps/mobile/eas.json`](../../apps/mobile/eas.json) | EAS profiles (`preview` APK, `production` AAB) |
| [`apps/mobile/assets/icon.png`](../../apps/mobile/assets/icon.png) | Main app icon |
| [`apps/mobile/assets/adaptive-icon.png`](../../apps/mobile/assets/adaptive-icon.png) | Android adaptive foreground |
| [`apps/mobile/assets/splash-brand.png`](../../apps/mobile/assets/splash-brand.png) | Splash / brand |
| [`apps/mobile/assets/notification-icon.png`](../../apps/mobile/assets/notification-icon.png) | Notification small icon |
| [`apps/mobile/src/constants/env.ts`](../../apps/mobile/src/constants/env.ts) | Typed `EXPO_PUBLIC_*` reads |
| [`apps/mobile/.env.example`](../../apps/mobile/.env.example) | Local / docs template |

---

## Versioning rules

| Field | Meaning | When to bump |
|-------|---------|--------------|
| `version` (`1.0.0`) | What users see in Play Store | Every visible release |
| `android.versionCode` (`1`) | Play internal build id | **Every** AAB upload (must always increase) |
| `ios.buildNumber` (`1`) | App Store build id | Every iOS upload |

Edit constants at the top of `app.config.js`:

```js
const APP_VERSION = '1.0.0';
const ANDROID_VERSION_CODE = 1;
const IOS_BUILD_NUMBER = '1';
```

---

## Permissions (declared)

**Android** (`app.config.js` → `android.permissions`):

- `INTERNET`, `ACCESS_NETWORK_STATE` — API  
- `POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` — push  
- `READ_MEDIA_IMAGES` — profile photo (image picker)

**iOS** — photo library usage strings + `remote-notification` background mode.

---

## Build process (explained)

```
1. You run:  eas build --platform android --profile production
2. EAS CLI uploads project archive to Expo servers
3. Cloud builder:
     - Reads app.config.js (version, icons, permissions)
     - Injects EAS "production" env (EXPO_PUBLIC_*)
     - Prebuild → native Android project
     - Gradle assembles release → .aab (App Bundle)
     - Signs with EAS-managed keystore
4. You download .aab from expo.dev
5. Upload .aab to Google Play Console (internal → production)
```

**Why AAB not APK for Play?** Google Play requires App Bundles for new apps; Play generates optimized APKs per device.

| Profile | Output | Use |
|---------|--------|-----|
| `preview` | `.apk` | Sideload / friends test |
| `production` | `.aab` | Play Store |

---

## Generate Android AAB

### 1. Production env on EAS (required)

Play users cannot reach your LAN IP. Set HTTPS API:

```bash
cd apps/mobile
eas env:create production --name EXPO_PUBLIC_API_BASE_URL --value https://api.yourdomain.com --visibility plaintext --force --non-interactive
eas env:create production --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --visibility plaintext --force --non-interactive
eas env:create production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON --visibility sensitive --force --non-interactive
eas env:create production --name EXPO_PUBLIC_APP_ENV --value production --visibility plaintext --force --non-interactive
eas env:create production --name EXPO_PUBLIC_EAS_PROJECT_ID --value d2cc3f6d-3ef7-4038-a29b-2966caee0c1b --visibility plaintext --force --non-interactive
```

### 2. Build

```bash
cd apps/mobile
eas login
npm run build:android:production
```

Same as: `eas build --platform android --profile production`

### 3. Download

Open the build URL on [expo.dev](https://expo.dev) → **Finished** → download `.aab`.

Free tier may **queue** a long time (hours). That is normal.

### 4. Next

Upload to Play Console → Internal testing first. See [mobile-play-store.md](./mobile-play-store.md).

---

## Local checklist before build

```bash
cd apps/mobile
npx expo config --type public   # sanity-check resolved config
npm run typecheck
```

Confirm assets exist under `assets/` and `notification-icon.png` is present.
