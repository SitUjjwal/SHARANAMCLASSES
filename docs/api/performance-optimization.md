# Performance Optimization

Backend (`apps/api`) + mobile (`apps/mobile`) performance work.

## Architecture

```
Mobile                              API
──────                              ───
React Query cache  ──GET──►  compression (gzip)
  stale/gcTime              apiCache (TTL Map + Cache-Control)
FlatList + infinite         pagination (.range / slice)
expo-image disk cache       Postgres indexes
getComponent / inlineRequires
Hermes
```

## Implementation map

| Area | What shipped |
|------|----------------|
| **Pagination** | `utils/pagination.ts`; paginated purchase history, my-courses, live classes public, student tests. Page shape: `{ items, page, pageSize, total, hasMore }` |
| **Lazy loading** | Mobile: FlatList + `useInfiniteQuery` (courses, notifications, live classes, purchase history); Test list uses FlatList virtualization |
| **Image caching** | `expo-image` + `cachePolicy="memory-disk"` on ProfilePhoto, VideoPoster (CourseCard/Banner already had it) |
| **DB indexes** | Migration `20260803100000_performance_indexes.sql` — videos, payments, activity logs, profiles, enrollments, tests, live_classes |
| **API caching** | `middlewares/apiCache.ts` — in-memory TTL for public GETs; `private, max-age=*` for catalog GETs with auth |
| **Compression** | Already on in `app.ts` (gzip, threshold 1KB) |
| **React Query** | Defaults: `staleTime 60s`, `gcTime 30m`, reconnect refetch; catalog helpers `CATALOG_STALE_MS` |
| **Code splitting** | `AppNavigator` secondary screens use `getComponent={() => require(...)}` |
| **Bundle** | Metro `inlineRequires: true`; `jsEngine: 'hermes'` in `app.config.js` |

## Apply indexes

Run in Supabase SQL editor (or CLI):

`infra/supabase/migrations/20260803100000_performance_indexes.sql`

## Notes / limits

- API cache is **process-local** (not Redis). Fine for single-instance; use Redis/CDN for multi-node.
- Auth mutations stay `no-store`.
- Student payment `status` query filter is reserved; filtering should move into SQL when needed.
- Chapter embeds request live classes with `pageSize: 100` (not infinite).
