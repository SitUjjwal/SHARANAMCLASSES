# FAQs

Admin-managed help center. Students search published FAQs by question or answer.

## Architecture

```
Admin FaqsPage
  Create / Edit / Delete / ↑↓ Sort
        │
        ▼
  /admin/faqs  (+ PUT /admin/faqs/reorder)
        │
        ▼
  public.faqs  (sort_order, is_published)
        │
        ▼
Mobile FAQScreen  GET /faqs?q=search
  published only · debounced search · accordion items
```

| Layer | Role |
|-------|------|
| Migration | `faqs` table + seed rows + RLS deny-all |
| Shared | `Faq`, `CreateFaqInput`, `UpdateFaqInput` |
| API | Student search + admin CRUD + reorder |
| Admin | `/faqs` — form modal, publish toggle, move up/down |
| Mobile | Search field → `GET /faqs?q=` → expandable list |

## Student API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/faqs?q=` | Published FAQs ordered by `sort_order`. Optional `q` filters question/answer (`ilike`). |

## Admin APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/faqs` | All FAQs (including drafts) |
| `POST` | `/admin/faqs` | Create |
| `PATCH` | `/admin/faqs/:faqId` | Edit fields / publish |
| `DELETE` | `/admin/faqs/:faqId` | Delete |
| `PUT` | `/admin/faqs/reorder` | `{ "ordered_ids": ["uuid", …] }` — must list every FAQ once |

### Create body

```json
{
  "question": "How do I access purchased courses?",
  "answer": "Open My Learning from the bottom tabs…",
  "category": "courses",
  "is_published": true
}
```

`sort_order` is auto-assigned (+10) if omitted. Reorder rewrites to `10, 20, 30…`.

## Migration

`infra/supabase/migrations/20260802250000_faqs.sql`

Seeds four starter FAQs if the table is empty.

## Mobile entry

Feedback & Support → **FAQ**
