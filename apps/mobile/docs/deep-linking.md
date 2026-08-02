# Deep Linking (notifications + banners)

When a push / inbox notification (or banner) is opened, the app navigates to the right screen — including **cold start** (app was killed).

---

## Destinations

| Tap target | Opens |
|------------|--------|
| Course | `CourseDetail` |
| Live Class | Live tab |
| Test | `TestList` |
| Announcement | Home → Latest Announcements |
| Banner destination | Course / Test / Live / Website (same as banner redirect) |

---

## Implementation

```
Notification tap (FG / BG / killed)
        │
        ▼
getLastNotificationResponseAsync  (cold start)
addNotificationResponseReceivedListener  (runtime)
        │
        ▼
openDeepLinkFromNotificationData(data)
        │
        ├─ resolveNotificationDeepLink / parseDeepLinkUrl
        │
        ├─ if nav not ready or not authenticated
        │      → queueDeepLink (pending)
        │
        └─ else navigate via navigationRef
                │
RootNavigator onReady + auth ready
        └─ flushPendingDeepLinks()
```

### Key files

| File | Role |
|------|------|
| `navigation/navigationRef.ts` | Global `NavigationContainer` ref |
| `navigation/deepLinking.ts` | Parse + queue + navigate |
| `modules/notifications/handleNotificationResponse.ts` | Notification → deep linker |
| `navigation/RootNavigator.tsx` | `ref` + `onReady` flush + linking config |
| `modules/banners/openBannerRedirect.ts` | Banner tap uses same router |

### Cold start

1. User taps notification while app is **killed**
2. OS launches app; Expo exposes the response via `getLastNotificationResponseAsync`
3. Payload is **queued** until splash finishes, session restores, and `NavigationContainer` is ready
4. `flushPendingDeepLinks()` runs → navigates once
5. Response cleared so the next launch does not repeat the same jump

### Notification `data` payload (API / FCM)

```json
{ "type": "course", "courseId": "<uuid>" }
{ "type": "live_class", "liveClassId": "<uuid>" }
{ "type": "test_reminder", "testId": "<uuid>" }
{ "type": "announcement", "announcementId": "<uuid>" }
{ "type": "banner", "redirect_type": "course", "redirect_target_id": "<uuid>" }
{ "deepLink": "sharanam://course/<uuid>" }
```

### URL schemes

- `sharanam://course/<id>`
- `sharanam://live` / `sharanam://live/<id>`
- `sharanam://tests` / `sharanam://test/<id>`
- `sharanam://announcement/<id>`
- `sharanam://notifications`
- `sharanam://home`
- `https://…` → external browser
