# Admin Notification Dashboard (Delivery Reports)

KPIs and campaign list for Module 7 push / inbox notifications.

Admin UI: **Delivery Reports** (`/delivery-reports`). Legacy path `/notification-dashboard` redirects there.

---

## Architecture

```
Admin NotificationsDashboardPage
        │
        ├─ GET /admin/notifications/stats      → KPI cards
        ├─ GET /admin/notifications/campaigns  → search / filter / page
        └─ GET /admin/notifications/export     → CSV download
                │
                ▼
   notifications (campaigns)
   notification_deliveries (push status → delivered / failed)
   notification_inbox.read_at (opened / click proxy)
```

| KPI | Source |
|-----|--------|
| **Total Notifications** | Count of `notifications` campaigns |
| **Delivered** | Sum of `push_success_count` |
| **Failed** | Sum of `push_failure_count` |
| **Opened** | Inbox rows with `read_at` set (mark-read / open in center) |
| **Click Rate** | `opened / delivered × 100` |

---

## APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/notifications/stats` | KPI summary |
| `GET` | `/admin/notifications/campaigns?search&status&type&page&pageSize` | Paginated table |
| `GET` | `/admin/notifications/export?search&status&type` | `{ filename, csv }` |

### Stats response

```json
{
  "total_notifications": 12,
  "delivered": 840,
  "opened": 210,
  "failed": 40,
  "click_rate_percent": 25
}
```

### Campaign row

`title`, `type`, `status`, `delivered`, `opened`, `failed`, `click_rate_percent`, `sent_at`

---

## Admin UI

Sidebar → **Notification Dashboard**

- 5 stat cards  
- Search (title/body)  
- Filter by status + type  
- Export CSV  
- Pagination  

---

## Files

| Path | Role |
|------|------|
| `notificationAdmin.service.ts` | Aggregations + CSV |
| `NotificationsDashboardPage.tsx` | Admin UI |
| `features/notifications/api.ts` | Client |
| `packages/shared/.../notifications.ts` | DTOs |
