-- Course Rating & Review
-- One review per (user, course). Admin must approve before public display.
-- courses.rating / courses.review_count are denormalized from approved reviews.

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null,
  comment text not null default '',
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'approved', 'rejected')),
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_reviews_rating_check check (rating >= 1 and rating <= 5),
  constraint course_reviews_user_course_unique unique (user_id, course_id)
);

create index if not exists course_reviews_course_approved_idx
  on public.course_reviews (course_id, created_at desc)
  where status = 'approved';

create index if not exists course_reviews_admin_status_idx
  on public.course_reviews (status, created_at desc);

create index if not exists course_reviews_user_idx
  on public.course_reviews (user_id, created_at desc);

alter table public.courses
  add column if not exists review_count integer not null default 0;

do $$
begin
  alter table public.courses
    add constraint courses_review_count_check check (review_count >= 0);
exception
  when duplicate_object then null;
end $$;

alter table public.course_reviews enable row level security;

drop policy if exists "course_reviews_deny_all" on public.course_reviews;
create policy "course_reviews_deny_all"
  on public.course_reviews
  for all
  using (false)
  with check (false);

comment on table public.course_reviews is
  'Student course ratings (1–5) + review text; one per user/course; admin approval required';
comment on column public.courses.rating is
  'Average of approved course_reviews (0 when none)';
comment on column public.courses.review_count is
  'Count of approved course_reviews';
