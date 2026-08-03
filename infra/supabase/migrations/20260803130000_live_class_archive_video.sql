-- After a live class ends, its YouTube link can be archived onto the course as a video.
alter table public.live_classes
  add column if not exists archived_video_id uuid references public.videos (id) on delete set null;

create index if not exists live_classes_archive_pending_idx
  on public.live_classes (end_time)
  where archived_video_id is null
    and course_id is not null
    and is_published = true;

comment on column public.live_classes.archived_video_id is
  'Video created on the linked course after this live class ends (recording / replay).';
