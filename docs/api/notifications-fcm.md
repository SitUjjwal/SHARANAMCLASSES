# Module 7 — FCM / Push notifications (foundation)

Production-ready Expo SDK 54 push pipeline: permission → device token (FCM/APNs/Expo) → API storage → foreground / background / killed handlers.

---

## What works now

| Path | How to verify |
|------|----------------|
| Permission prompt | Login → OS asks for notifications (Android 13+ after channel create) |
| Token register | Profile shows `Push: FCM\|APNS\|EXPO · granted` + token snippet |
| Token sync | `PUT /devices/push-token` (apply migration first) |
| Token refresh | `Notifications.addPushTokenListener` → re-PUT |
| Foreground | Local/remote notification shows banner while app open |
| Background | Local test while app minimized |
| Killed / tap | Cold start reads `getLastNotificationResponseAsync` |
| Smoke test | Profile → **Test notification (2s)** |

Remote FCM *send* needs Firebase service account on the API (`FIREBASE_SERVICE_ACCOUNT_PATH` or `_JSON`). Without it, registration still works; sends no-op safely.

**Campaign fan-out (save + audience + delivery status):** see [Notification Service](./notification-service.md).

---

## Files (why each exists)

### Mobile (`apps/mobile`)

| File | Role |
|------|------|
| `index.ts` | Imports background task **before** root mount |
| `app.config.js` | `expo-notifications` plugin + optional `google-services.json` |
| `src/modules/notifications/backgroundNotificationTask.ts` | TaskManager handler for background/killed deliveries |
| `configureNotifications.ts` | Foreground handler + Android channels |
| `stableDeviceId.ts` | SecureStore UUID keyed with push token upsert |
| `registerForPush.ts` | Permission + prefer FCM/APNs, fallback Expo token |
| `notification.service.ts` | `PUT/DELETE /devices/push-token` via Axios |
| `handleNotificationResponse.ts` | Tap → deep link / tab navigation |
| `scheduleLocalSmokeNotification.ts` | Local 2s notification to prove handlers |
| `NotificationProvider.tsx` | Auth-gated register, listeners, refresh |
| `App.tsx` | Wraps app in `NotificationProvider` |
| `ProfileTabScreen.tsx` | Status + **Test notification** button |

### API (`apps/api`)

| File | Role |
|------|------|
| `integrations/fcm/client.ts` | Firebase Admin multicast send (optional creds) |
| `validators/devicePush.validators.ts` | Zod for upsert/deactivate |
| `services/devicePush.service.ts` | Upsert / deactivate / list tokens |
| `controllers/devicePush.controller.ts` | HTTP handlers |
| `routes/devicePush.routes.ts` | `PUT|DELETE /devices/push-token` |

### Database

| File | Role |
|------|------|
| `infra/supabase/migrations/20260802100000_device_push_tokens.sql` | `device_push_tokens` table + RLS deny (service role only) |

### Shared

| File | Role |
|------|------|
| `packages/shared/src/types/notifications.ts` | `DevicePushToken`, providers |

---

## Setup checklist

1. **Migration** — run `20260802100000_device_push_tokens.sql` in Supabase SQL editor.
2. **API** — restart `npm run dev` in `apps/api`. Optional: set `FIREBASE_SERVICE_ACCOUNT_PATH`.
3. **Firebase Android (production FCM token)**  
   - Create Firebase project → add Android app `com.sharanamclasses.app`  
   - Download `google-services.json` → `apps/mobile/google-services.json`  
   - Use a **dev/production build** (`eas build` / `npx expo run:android`). Expo Go may only yield Expo tokens / limited push.
4. **EAS projectId (Expo token fallback)** — `eas init`, then set `EXPO_PUBLIC_EAS_PROJECT_ID` or edit `app.config.js` `extra.eas.projectId`.
5. **Mobile** — reload app, login, allow notifications, open Profile → Test notification.

---

## API contract

### `PUT /devices/push-token` (auth)

```json
{
  "device_id": "android-…",
  "token": "…",
  "provider": "fcm",
  "platform": "android",
  "app_version": "1.0.0"
}
```

### `DELETE /devices/push-token` (auth)

```json
{ "device_id": "android-…" }
```

---

## Architecture notes

- **Native FCM/APNs** = `getDevicePushTokenAsync()` — send with Firebase Admin / APNs.
- **Expo token** = `getExpoPushTokenAsync()` — send with Expo Push API (good for Expo Go).
- Tokens are upserted on `(user_id, device_id)` and deactivated on logout.
- Deep links use `data.deepLink` (`sharanam://…`) or `data.type` (`live_class`, `test_reminder`, `course_update`).

Next Module 7 slices (not in this foundation): scheduled jobs, live-class FCM fan-out, announcement center UI, notification history screen.
