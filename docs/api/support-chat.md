# Basic Chat Support

Student ↔ admin messaging with history, unread counts, and a typing-indicator placeholder.

## Architecture

```
Mobile ChatSupportScreen
  poll GET /support/chat every ~3.5s
  POST /support/chat/messages
  POST /support/chat/read  (clears unread)
        │
        ▼
support_conversations  (1 per student)
support_messages       (student | admin)
        │
        ▼
Admin SupportChatPage
  GET /admin/support/chats
  POST …/messages · …/read · …/typing
```

| Concern | Implementation |
|---------|----------------|
| Send message | `POST /support/chat/messages` `{ body }` |
| History | Full thread returned by `GET /support/chat` |
| Admin replies | Admin posts to `/admin/support/chats/:id/messages` |
| Unread badge | Admin messages after `student_last_read_at`; `GET /support/chat/unread-count` |
| Typing placeholder | Admin `POST …/typing { typing:true }` while composing; student shows “Support is typing…” if flag is fresh (&lt;5s) |
| Realtime | Polling (basic); can later swap for websockets/SSE |

## Student APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/support/chat` | Get-or-create thread + messages + `admin_typing` + `unread_count` |
| `GET` | `/support/chat/unread-count` | Badge count only |
| `POST` | `/support/chat/messages` | Send `{ "body": "…" }` |
| `POST` | `/support/chat/read` | Mark admin messages as read |

## Admin APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/support/chats` | Inbox (preview + unread) |
| `GET` | `/admin/support/chats/:id` | Full thread |
| `POST` | `/admin/support/chats/:id/messages` | Reply |
| `POST` | `/admin/support/chats/:id/read` | Clear student unread for admin |
| `POST` | `/admin/support/chats/:id/typing` | `{ "typing": true \| false }` |

## Migration

`infra/supabase/migrations/20260802260000_support_chat.sql`

## Mobile / Admin entry

- Student: Feedback → **Chat with us** (badge)
- Admin: **Chat Support** (`/support-chat`)
