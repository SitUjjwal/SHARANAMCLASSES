-- Scheduled live classes (YouTube Live URL + time window in PostgreSQL)
create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text not null default '',
  youtube_url text not null,
  youtube_video_id text not null,
  thumbnail_url text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_published boolean not null default true,
  notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_classes_end_after_start check (end_time > start_time)
);

create index if not exists live_classes_course_idx on public.live_classes (course_id, start_time);
create index if not exists live_classes_start_idx on public.live_classes (start_time);
create index if not exists live_classes_youtube_id_idx on public.live_classes (youtube_video_id);

create index if not exists live_classes_upcoming_idx
  on public.live_classes (start_time)
  where is_published = true;

alter table public.live_classes enable row level security;

drop policy if exists "Authenticated read published live classes" on public.live_classes;
create policy "Authenticated read published live classes"
  on public.live_classes
  for select
  to authenticated
  using (
    is_published = true
    and (
      course_id is null
      or exists (
        select 1
        from public.courses c
        where c.id = live_classes.course_id
          and c.is_published = true
      )
    )
  );

comment on table public.live_classes is 'Scheduled YouTube Live classes — URL + schedule in Postgres, never video binary';
comment on column public.live_classes.notification_sent_at is 'Set when admin sends in-app (app_updates) notification';
