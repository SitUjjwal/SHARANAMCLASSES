-- Module 8: certificates + achievements for student Profile.

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text not null default '',
  certificate_url text,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists certificates_user_issued_idx
  on public.certificates (user_id, issued_at desc);

alter table public.certificates enable row level security;

drop policy if exists "certificates_deny_all" on public.certificates;
create policy "certificates_deny_all"
  on public.certificates
  for all
  using (false)
  with check (false);

comment on table public.certificates is
  'Issued course/completion certificates shown in student Profile';

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

drop policy if exists "achievements_deny_all" on public.achievements;
create policy "achievements_deny_all"
  on public.achievements
  for all
  using (false)
  with check (false);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements_deny_all" on public.user_achievements;
create policy "user_achievements_deny_all"
  on public.user_achievements
  for all
  using (false)
  with check (false);

-- Seed starter achievement catalog (idempotent)
insert into public.achievements (code, title, description, icon, sort_order)
values
  ('first_login', 'Welcome aboard', 'Opened the SHARANAM app for the first time.', 'star', 10),
  ('first_course', 'First course', 'Enrolled in your first course.', 'book', 20),
  ('first_test', 'Quiz starter', 'Completed your first test attempt.', 'flask', 30),
  ('streak_7', '7-day streak', 'Studied seven days in a row.', 'flame', 40),
  ('course_complete', 'Course finisher', 'Reached 100% progress on a course.', 'trophy', 50)
on conflict (code) do nothing;
