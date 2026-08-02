-- Per-user video playback position for Continue Watching.

create table if not exists public.video_watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position_seconds double precision not null default 0
    check (position_seconds >= 0),
  duration_seconds double precision not null default 0
    check (duration_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index if not exists video_watch_progress_user_updated_idx
  on public.video_watch_progress (user_id, updated_at desc);

create index if not exists video_watch_progress_video_idx
  on public.video_watch_progress (video_id);

comment on table public.video_watch_progress is
  'Student playback position — saved ~every 15s; powers Continue Watching on Home';

alter table public.video_watch_progress enable row level security;

drop policy if exists "video_watch_progress_own" on public.video_watch_progress;
create policy "video_watch_progress_own" on public.video_watch_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
