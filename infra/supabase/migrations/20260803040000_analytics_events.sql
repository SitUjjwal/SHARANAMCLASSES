-- Analytics event tables: PDF downloads + live class attendance

create table if not exists public.pdf_download_events (
  id uuid primary key default gen_random_uuid(),
  pdf_id uuid not null references public.pdfs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  downloaded_at timestamptz not null default now()
);

create index if not exists pdf_download_events_pdf_idx
  on public.pdf_download_events (pdf_id, downloaded_at desc);

create index if not exists pdf_download_events_downloaded_idx
  on public.pdf_download_events (downloaded_at desc);

alter table public.pdf_download_events enable row level security;

drop policy if exists "pdf_download_events_deny_all" on public.pdf_download_events;
create policy "pdf_download_events_deny_all"
  on public.pdf_download_events
  for all using (false) with check (false);

create table if not exists public.live_class_attendance (
  id uuid primary key default gen_random_uuid(),
  live_class_id uuid not null references public.live_classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (live_class_id, user_id)
);

create index if not exists live_class_attendance_class_idx
  on public.live_class_attendance (live_class_id);

create index if not exists live_class_attendance_user_idx
  on public.live_class_attendance (user_id, joined_at desc);

alter table public.live_class_attendance enable row level security;

drop policy if exists "live_class_attendance_deny_all" on public.live_class_attendance;
create policy "live_class_attendance_deny_all"
  on public.live_class_attendance
  for all using (false) with check (false);

comment on table public.pdf_download_events is
  'Tracked PDF download events for Analytics Most Downloaded PDFs';
comment on table public.live_class_attendance is
  'Student join records for Analytics Live Class Attendance';
