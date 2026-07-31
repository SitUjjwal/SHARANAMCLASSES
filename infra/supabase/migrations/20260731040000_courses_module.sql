-- Module 3: categories, banners, courses, chapters, enrollments, quotes, updates
-- Profiles get an app role for admin course CRUD.

-- ---------------------------------------------------------------------------
-- profiles.role
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text;

update public.profiles
set role = 'student'
where role is null or btrim(role) = '';

alter table public.profiles
  alter column role set default 'student';

alter table public.profiles
  alter column role set not null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'instructor'));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- banners
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image text not null,
  redirect_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  slug text not null unique,
  description text not null default '',
  thumbnail_url text,
  class_level text,
  medium text check (medium is null or medium in ('hindi', 'english')),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_published_idx on public.courses (is_published, sort_order);
create index if not exists courses_featured_idx on public.courses (is_featured, is_published);
create index if not exists courses_category_idx on public.courses (category_id);

-- ---------------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  video_url text,
  is_free_preview boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapters_course_idx on public.chapters (course_id, sort_order);

-- ---------------------------------------------------------------------------
-- enrollments (My Courses)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_idx on public.enrollments (user_id);

-- ---------------------------------------------------------------------------
-- motivational quotes
-- ---------------------------------------------------------------------------
create table if not exists public.motivational_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  author text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- latest updates / announcements
-- ---------------------------------------------------------------------------
create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS (mobile reads published content via API service role; policies for direct access)
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.banners enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.enrollments enable row level security;
alter table public.motivational_quotes enable row level security;
alter table public.app_updates enable row level security;

-- Authenticated students can read published catalog
drop policy if exists "categories_read_active" on public.categories;
create policy "categories_read_active" on public.categories
  for select to authenticated using (is_active = true);

drop policy if exists "banners_read_active" on public.banners;
create policy "banners_read_active" on public.banners
  for select to authenticated using (status = 'active');

drop policy if exists "courses_read_published" on public.courses;
create policy "courses_read_published" on public.courses
  for select to authenticated using (is_published = true);

drop policy if exists "chapters_read_published" on public.chapters;
create policy "chapters_read_published" on public.chapters
  for select to authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

drop policy if exists "enrollments_own" on public.enrollments;
create policy "enrollments_own" on public.enrollments
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quotes_read_active" on public.motivational_quotes;
create policy "quotes_read_active" on public.motivational_quotes
  for select to authenticated using (is_active = true);

drop policy if exists "updates_read_published" on public.app_updates;
create policy "updates_read_published" on public.app_updates
  for select to authenticated using (is_published = true);

-- ---------------------------------------------------------------------------
-- Seed taxonomy — Home subjects (expected dashboard)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, icon, sort_order)
values
  ('Maths', 'maths', '📘', 10),
  ('Science', 'science', '🧪', 20),
  ('English', 'english', '📙', 30),
  ('Social', 'social', '🌎', 40)
on conflict (slug) do nothing;

insert into public.motivational_quotes (quote_text, author, is_active)
select
  'Success is the sum of small efforts repeated every day.',
  'SHARANAM CLASSES',
  true
where not exists (select 1 from public.motivational_quotes limit 1);
