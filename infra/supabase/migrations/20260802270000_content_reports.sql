-- Content quality reports (incorrect video/PDF, broken link, bad question, duplicate)

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_type text not null
    check (report_type in (
      'incorrect_video',
      'wrong_pdf',
      'broken_link',
      'incorrect_question',
      'duplicate_content'
    )),
  description text not null,
  target_type text
    check (
      target_type is null
      or target_type in ('video', 'pdf', 'note', 'question', 'chapter', 'course', 'other')
    ),
  target_id uuid,
  course_id uuid references public.courses (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  target_label text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text,
  resolved_at timestamptz,
  closed_at timestamptz,
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_description_len check (char_length(trim(description)) >= 10),
  constraint content_reports_ticket_number_unique unique (ticket_number)
);

create index if not exists content_reports_user_idx
  on public.content_reports (user_id, created_at desc);

create index if not exists content_reports_admin_status_idx
  on public.content_reports (status, created_at desc);

create index if not exists content_reports_type_idx
  on public.content_reports (report_type, created_at desc);

create sequence if not exists public.content_report_ticket_seq;

create or replace function public.next_content_report_ticket_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.content_report_ticket_seq');
  return 'CR' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || lpad(n::text, 5, '0');
end;
$$;

alter table public.content_reports enable row level security;

drop policy if exists "content_reports_deny_all" on public.content_reports;
create policy "content_reports_deny_all"
  on public.content_reports
  for all
  using (false)
  with check (false);

comment on table public.content_reports is
  'Student reports for incorrect/broken content; admin triage dashboard';
