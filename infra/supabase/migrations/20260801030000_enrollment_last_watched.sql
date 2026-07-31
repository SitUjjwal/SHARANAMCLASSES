-- Last watched chapter on enrollments — powers Continue Learning on My Courses.

alter table public.enrollments
  add column if not exists last_watched_chapter_id uuid
    references public.chapters (id) on delete set null;

alter table public.enrollments
  add column if not exists last_watched_at timestamptz;

create index if not exists enrollments_user_last_watched_idx
  on public.enrollments (user_id, last_watched_at desc nulls last);

comment on column public.enrollments.last_watched_chapter_id is
  'Most recently opened chapter for Continue Learning';
comment on column public.enrollments.last_watched_at is
  'When last_watched_chapter_id was updated';
