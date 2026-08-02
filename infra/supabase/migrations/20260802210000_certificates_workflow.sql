-- Certificate workflow: number, status, approval, PDF storage key.

alter table public.certificates
  add column if not exists certificate_number text,
  add column if not exists status text not null default 'pending_approval',
  add column if not exists student_name text not null default '',
  add column if not exists storage_key text,
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists approved_by uuid references auth.users (id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_reason text;

-- Backfill existing rows as issued if they already have a URL
update public.certificates
set status = 'issued'
where certificate_url is not null
  and status = 'pending_approval';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'certificates_status_check'
  ) then
    alter table public.certificates
      add constraint certificates_status_check
      check (status in ('pending_approval', 'issued', 'rejected'));
  end if;
end $$;

create unique index if not exists certificates_number_unique
  on public.certificates (certificate_number)
  where certificate_number is not null;

create unique index if not exists certificates_user_course_unique
  on public.certificates (user_id, course_id)
  where course_id is not null;

create index if not exists certificates_status_requested_idx
  on public.certificates (status, requested_at desc);

comment on column public.certificates.status is
  'pending_approval → admin approve → issued (PDF); or rejected';
comment on column public.certificates.certificate_number is
  'Human-readable id assigned on approval, e.g. SC-2026-A1B2C3';
