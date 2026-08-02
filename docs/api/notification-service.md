# Module 7 — Notification Service

Save campaigns, resolve audiences, push via Firebase Admin (FCM) + Expo Push, store per-device delivery status.

---

## Architecture

```
Admin POST /notifications
        │
        ▼
┌─────────────────────┐
│  saveNotification   │  → row in `notifications` (draft)
└─────────┬───────────┘
          │ POST /notifications/send  (or send:true on create)
          ▼
┌─────────────────────┐
│ resolveAudience     │  single_user | all_users | class | course
│  → user_id[]        │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ device_push_tokens  │  active tokens per user
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ notification_       │  pending | skipped_no_token
│ deliveries          │
└─────────┬───────────┘
          ▼
   ┌──────┴──────┐
   ▼             ▼
 FCM Admin    Expo Push API
 (provider    (provider=expo)
  =fcm)
   └──────┬──────┘
          ▼
 delivery status sent|failed + campaign aggregates
```

| Audience | Resolution |
|----------|------------|
| `single_user` | `audience_user_id` |
| `all_users` | all `profiles.id` |
| `class` | `profiles` where `class_level = audience_class_level` |
| `course` | `enrollments.user_id` where `course_id = audience_course_id` |

---

## Files

| File | Role |
|------|------|
| `infra/supabase/migrations/20260802110000_notifications.sql` | `notifications` + `notification_deliveries` |
| `apps/api/src/services/notification.service.ts` | Save, audience resolve, send, delivery status |
| `apps/api/src/integrations/fcm/client.ts` | Firebase Admin multicast |
| `apps/api/src/integrations/expoPush/client.ts` | Expo Go token sends |
| `apps/api/src/validators/notification.validators.ts` | Zod create body |
| `apps/api/src/controllers/notification.controller.ts` | HTTP |
| `apps/api/src/routes/notification.routes.ts` | Mount paths |
| `packages/shared/src/types/notifications.ts` | Shared DTOs |

---

## API

### `POST /notifications` (admin)

Save a campaign (draft by default). Set `"send": true` to push immediately.

```json
{
  "title": "Live class starting",
  "body": "Physics — Chapter 3 starts in 10 min",
  "deep_link": "sharanam://live",
  "notification_type": "live_class",
  "audience_type": "course",
  "audience_course_id": "<uuid>",
  "data": { "liveClassId": "<uuid>" },
  "send": false
}
```

Audience shapes:

```json
{ "audience_type": "single_user", "audience_user_id": "<uuid>" }
{ "audience_type": "all_users" }
{ "audience_type": "class", "audience_class_level": "10" }
{ "audience_type": "course", "audience_course_id": "<uuid>" }
```

### `POST /notifications/send` (admin)

```json
{ "notification_id": "<uuid>" }
```

### `PUT /notifications/:id` (admin)

Update campaign title, body, audience, etc. Inbox shows the updated title/body.
Optional `"send": true` pushes only if status is still `draft`.

### `DELETE /notifications/:id` (admin)

Hard-deletes the campaign (cascades deliveries + inbox rows).

### Other

| Method | Path | Auth |
|--------|------|------|
| GET | `/notifications` | admin (campaign list) |
| GET | `/notifications/:id` | admin (+ deliveries) |
| GET | `/notification-history` | student (personal history) |


---

## Delivery status

| Status | Meaning |
|--------|---------|
| `pending` | Queued before push |
| `sent` | Provider accepted |
| `failed` | Provider rejected / error |
| `skipped_no_token` | User has no active device token |

Campaign `status`: `draft` → `sending` → `sent` | `partial` | `failed`.

Invalid FCM tokens are deactivated on `device_push_tokens`.

---

## Setup

1. Run migration `20260802110000_notifications.sql` (and device tokens migration if not yet).
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH` (or `_JSON`) on the API for real FCM.
3. Expo Go tokens use Expo Push API (no Firebase creds required for those).
