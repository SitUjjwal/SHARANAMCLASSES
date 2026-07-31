-- Dedicated video catalog (YouTube unlisted URLs only — no video binary in DB)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  title text not null,
  description text not null default '',
  youtube_url text not null,
  youtube_video_id text not null,
  video_type text not null default 'recorded'
    check (video_type in ('recorded', 'live')),
  thumbnail_url text,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  sort_order int not null default 0,
  is_free boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_course_idx on public.videos (course_id, sort_order);
create index if not exists videos_chapter_idx on public.videos (chapter_id, sort_order);
create index if not exists videos_type_idx on public.videos (video_type);
create index if not exists videos_youtube_id_idx on public.videos (youtube_video_id);

create unique index if not exists videos_chapter_youtube_unique
  on public.videos (chapter_id, youtube_video_id);

alter table public.videos enable row level security;

drop policy if exists "Authenticated read published videos" on public.videos;
create policy "Authenticated read published videos"
  on public.videos
  for select
  to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = videos.chapter_id
        and ch.is_published = true
        and c.is_published = true
    )
  );

comment on table public.videos is 'Course chapter videos — stores YouTube URL only, never binary files';
comment on column public.videos.youtube_url is 'Full YouTube watch/embed URL (prefer unlisted)';
comment on column public.videos.youtube_video_id is 'Extracted 11-char YouTube video id';
comment on column public.videos.video_type is 'recorded | live';
