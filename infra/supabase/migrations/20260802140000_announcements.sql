-- Module 7: Announcements (admin CRUD + Home feed)
-- Schedule = scheduled_at (visible when <= now() and is_published)
-- Pin = is_pinned (sorted first on Home)
-- Rich text = body HTML
-- Image = image_url

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  scheduled_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_home_idx
  on public.announcements (is_pinned desc, scheduled_at desc)
  where is_published = true;

create index if not exists announcements_admin_idx
  on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements_deny_all" on public.announcements;
create policy "announcements_deny_all"
  on public.announcements
  for all
  using (false)
  with check (false);

comment on table public.announcements is
  'Home announcements: pin, schedule, rich HTML body, optional image';

-- Backfill from legacy app_updates (plain text body).
insert into public.announcements (
  title, body, is_pinned, is_published, scheduled_at, published_at, created_at
)
select
  title,
  body,
  false,
  is_published,
  published_at,
  published_at,
  created_at
from public.app_updates;
