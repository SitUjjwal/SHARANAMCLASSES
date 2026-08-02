# Module 7 — Notification Center

Student inbox: unread badge, mark read, delete, pull-to-refresh, pagination, grouped by date.

---

## Architecture

```
Push / admin send
      │
      ▼
notification_inbox  (1 row per user × notification)
      │
      ├── GET  /notification-history?page&pageSize
      ├── GET  /notification-history/unread-count   → Home bell badge
      ├── PATCH /notification-history/:id/read
      ├── POST /notification-history/read-all
      └── DELETE /notification-history/:id         → soft delete
      │
      ▼
NotificationCenterScreen (SectionList by Today / Yesterday / date)
```

| Layer | Role |
|-------|------|
| `notification_inbox` | Read/unread + soft delete (not device deliveries) |
| API history routes | Paginated page + badge count |
| React Query | Infinite history + unread poll (60s) |
| Home `GreetingHeader` | Bell + red unread badge |
| `NotificationCenterScreen` | Grouped list UX |

---

## Student API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/notification-history?page=1&pageSize=20` | `{ items, page, pageSize, total, hasMore, unreadCount }` |
| GET | `/notification-history/unread-count` | `{ unreadCount }` |
| PATCH | `/notification-history/:inboxId/read` | Mark one read |
| POST | `/notification-history/read-all` | Mark all read |
| DELETE | `/notification-history/:inboxId` | Soft delete |

Inbox item:

```json
{
  "id": "<inbox uuid>",
  "notification_id": "<campaign uuid>",
  "title": "...",
  "body": "...",
  "deep_link": "sharanam://live",
  "data": {},
  "notification_type": "live_class",
  "is_read": false,
  "read_at": null,
  "created_at": "..."
}
```

---

## Mobile files

| File | Role |
|------|------|
| `screens/NotificationCenterScreen.tsx` | SectionList UI |
| `components/NotificationInboxRow.tsx` | Unread dot + delete |
| `utils/groupByDate.ts` | Today / Yesterday / date groups |
| `hooks/useNotificationHistoryInfiniteQuery.ts` | Pagination |
| `hooks/useUnreadNotificationCountQuery.ts` | Badge |
| `hooks/useNotificationInboxMutations.ts` | Read / delete |
| `GreetingHeader.tsx` | Bell + badge |
| `AppNavigator` / drawer / deep link `notifications` | Entry points |

---

## Setup

1. Apply migration `20260802120000_notification_inbox.sql` (after notifications + device tokens).
2. Restart API + reload Expo.
3. Home → bell icon → Notification Center.
