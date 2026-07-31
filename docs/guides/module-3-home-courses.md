# Module 3 — Home Dashboard & Course Management

## What you get

### Student (mobile)
- Bottom tabs: **Home · Courses · My Learning · Profile**
- Home sections: greeting, quote, banners, categories, featured, my courses, updates
- Course list + course detail with chapters
- React Query loading skeletons, empty states, error + retry

### API
- `GET /dashboard` (auth)
- Flat catalog (see [Catalog API](../api/catalog.md)):
  - `GET|POST /courses`, `PUT|DELETE /courses/:id`
  - `GET|POST /chapters`, `PUT|DELETE /chapters/:id`, `PUT /chapters/reorder`
  - `GET|POST /categories`
- Student helpers: `GET /courses/:id`, `GET /courses/:id/chapters`, enroll
- Admin panel: Vite app at `apps/admin` (Courses + Chapters CRUD)

### Database
Run in Supabase SQL Editor:

`infra/supabase/migrations/20260731040000_courses_module.sql`

This creates categories, banners, courses, chapters, enrollments, quotes, updates, and seeds class categories + one quote.

## Make yourself admin (for course CRUD)

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL@example.com';
```

Then call admin endpoints with that user’s Bearer token.

## Component map (why each exists)

| Component | Why |
|---|---|
| `GreetingHeader` | Personalized open to the dashboard |
| `QuoteCard` | Daily motivation from API (empty if none) |
| `BannerSlider` | Promo carousel; empty until banners published |
| `CategoriesGrid` | Browse by class / exam / computer |
| `CourseCard` | Reusable course tile → detail |
| `CourseHorizontalList` | Featured / my-courses rows |
| `UpdatesList` | Announcements feed |
| `HomeDashboardSkeleton` | Full-home loading placeholders |
| `EmptyState` / `ErrorState` / `SectionHeader` / `SkeletonBlock` | Shared UX primitives |

## Run

1. Apply `20260731040000_courses_module.sql`
2. Restart API (`apps/api` → `npm run dev`)
3. Reload Expo app and sign in

## Seed data (before Admin Panel)

Run in Supabase SQL Editor:

`infra/supabase/migrations/20260731060000_seed_home_dashboard.sql`

Adds: 3 banners, 4 subject categories, 4 featured courses + chapters, quote, 2 updates.
Then restart API and pull-to-refresh Home.

Reusable component: `apps/mobile/src/components/banners/BannerSlider.tsx`

- Auto-scroll (4s, pauses on drag)
- Pagination dots (tappable)
- Clickable → opens `link_url`
- Image cache via `expo-image` (`memory-disk`)
- API: `GET /banners` (also included in `GET /dashboard`)
- Admin update: `POST/PATCH/DELETE /admin/banners` (requires `profiles.role = admin`)

## Categories module

Folder: `apps/mobile/src/modules/categories/`

```
modules/categories/
  components/
    CategoryIcon.tsx    # emoji or Ionicons from DB `icon`
    CategoryCard.tsx    # reusable tile
    CategoriesGrid.tsx  # wrap grid + empty + optional searchQuery
  hooks/
    useCategoriesQuery.ts  # GET /categories?search=
  utils/
    filterCategories.ts    # client-side search helper
  screens/
    CategoriesScreen.tsx   # optional full browse + search UI
  index.ts
```

- API: `GET /categories` (auth), optional `?search=`
- Home uses dashboard categories via `CategoriesGrid`
- Courses tab uses Course List (search / filters / infinite scroll); Home category tap passes `categoryId`

## Course List module

Folder: `apps/mobile/src/modules/courses/`

```
modules/courses/
  components/
    CourseCard.tsx         # thumbnail, teacher, price, Free / Purchased
    CourseSearchBar.tsx
    CourseListFilters.tsx  # All / Free / Paid / Featured / medium
    CourseListSkeleton.tsx
  hooks/
    useCourseListInfiniteQuery.ts  # React Query infinite pages
    useCourseDetailQuery.ts
  screens/
    CourseListScreen.tsx
  utils/formatCoursePrice.ts
  index.ts
```

### Architecture

```
Search / Filters (UI state)
        ↓
useCourseListInfiniteQuery  →  queryKey: ['courses','list', filters]
        ↓
GET /courses?search&categoryId&price&page&pageSize
        ↓
Supabase courses + enrollments → items + is_purchased
        ↓
FlatList (infinite scroll) + RefreshControl + skeleton / error
```

- **Pagination:** `page` / `pageSize` (default 10); response `{ items, page, pageSize, total, hasMore }`
- **Infinite scroll:** `onEndReached` → `fetchNextPage`
- **Caching:** each filter combo is its own React Query cache; pages append under that key
- **Schema:** run `20260731080000_courses_list_fields.sql` for `teacher_name`, `price`, `is_free`

## Course Details

Folder: `apps/mobile/src/modules/courses/screens/CourseDetailScreen.tsx`

Displays: thumbnail, title, teacher, description, features, price, Buy / Enroll, chapters, related courses, share.

### Navigation

```
RootNavigator
 └─ AppNavigator (authenticated stack)
      ├─ MainTabs (bottom tabs)
      │    HomeTab / CoursesTab / MyLearningTab / ProfileTab
      └─ CourseDetail { courseId }   ← pushed above tabs
```

| From | Action |
|---|---|
| Home featured / my courses | `navigate('CourseDetail', { courseId })` |
| Courses list “View Details” | same |
| Related course card | `push('CourseDetail', { courseId })` (stack of details) |
| Deep link | `sharanam://course/:courseId` |
| Back / hero chevron | `goBack()` → previous tab screen |

API: `GET /courses/:id` (chapters + features + related) · `POST /courses/:id/enroll` (Buy)

Schema: `20260731100000_courses_features.sql`

## Chapter List module

Folder: `apps/mobile/src/modules/chapters/`

```
modules/chapters/
  components/ChapterCard.tsx     # number, name, duration, lock, counts
  hooks/useChaptersQuery.ts
  hooks/useChapterContentQuery.ts
  screens/ChapterListScreen.tsx
  screens/ChapterContentScreen.tsx
  utils/formatDuration.ts
```

### Architecture

```
CourseDetail
   │  "See all" / chapter tap
   ▼
ChapterListScreen  ← GET /courses/:courseId/chapters
   │  unlocked chapter tap
   ▼
ChapterContentScreen ← GET /courses/:courseId/chapters/:chapterId
   │
   └─ Videos / PDFs / Notes (locked → empty + enroll CTA)
```

| Field on card | Source |
|---|---|
| Chapter number | `chapter_number` (1-based order) |
| Name | `title` |
| Duration | `duration_seconds` |
| Locked/Unlocked | `is_locked` = !(enrolled \|\| free preview) |
| Video / PDF / Notes counts | `video_count`, `pdf_count`, `notes_count` |

Schema: `20260731110000_chapter_list_content.sql`

## Bihar Board course taxonomy

Migration: `20260731140000_courses_bihar_board_fields.sql`

| Column | Meaning | Example filters |
|--------|---------|-----------------|
| `class_level` | Class / grade | Class 10 |
| `stream` | Science / Arts / Commerce (null for 9–10) | Class 12 → Science |
| `medium` | Hindi / English instruction | Hindi Medium |
| `language` | Content language (usually = medium) | Hindi |
| `board` | Default `bihar_board` | Bihar Board |
| `academic_year` | Batch year | `2026-2027` |
| `subject` | Subject name | Physics |
| `teacher_id` | FK → `profiles` | Teacher account |

API query examples:

```
GET /courses?classLevel=10&medium=hindi
GET /courses?classLevel=12&stream=science&subject=Physics
GET /courses?board=bihar_board&academicYear=2026-2027
```

## Admin panel (Courses + Chapters)

App: `apps/admin` → `npm run dev:admin` (http://localhost:5173)

| Page | Actions |
|------|---------|
| Courses | Create / edit / delete, search, filters, thumbnail upload |
| Chapters | Per-course list, search, drag-and-drop or ↑↓ reorder, CRUD |

Requires API on `:4000` and admin role (`ADMIN_EMAILS` or `profiles.role = admin`).

## Pre–Module 4 testing checklist

### Home
- [ ] Home screen loads
- [ ] Banner slider works
- [ ] Categories load
- [ ] Featured courses load

### Courses
- [ ] Search works
- [ ] Pagination works (infinite scroll)
- [ ] Pull-to-refresh works
- [ ] Course details open

### Chapters
- [ ] Chapter order correct
- [ ] Locked chapters display properly

### Admin
- [ ] Create / edit / delete course
- [ ] Create / update / delete chapter

### Code
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] API docs current ([catalog.md](../api/catalog.md))

