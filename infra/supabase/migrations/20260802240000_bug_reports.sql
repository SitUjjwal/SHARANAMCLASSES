-- Bug reports — describe issue, select screen, optional screenshot, status tracking

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  screen_key text not null,
  screen_label text not null,
  screenshot_url text,
  screenshot_storage_key text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text,
  resolved_at timestamptz,
  closed_at timestamptz,
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bug_reports_description_len check (char_length(trim(description)) >= 10),
  constraint bug_reports_ticket_number_unique unique (ticket_number)
);

create index if not exists bug_reports_user_idx
  on public.bug_reports (user_id, created_at desc);

create index if not exists bug_reports_admin_status_idx
  on public.bug_reports (status, created_at desc);

create sequence if not exists public.bug_report_ticket_seq;

create or replace function public.next_bug_ticket_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.bug_report_ticket_seq');
  return 'BUG' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || lpad(n::text, 5, '0');
end;
$$;

alter table public.bug_reports enable row level security;

drop policy if exists "bug_reports_deny_all" on public.bug_reports;
create policy "bug_reports_deny_all"
  on public.bug_reports
  for all
  using (false)
  with check (false);

comment on table public.bug_reports is
  'Student bug reports with optional screenshot; admin status workflow';
