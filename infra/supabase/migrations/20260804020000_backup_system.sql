-- Module 12: Backup system — schedule policy + run history.
create table if not exists public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  enabled boolean not null default true,
  cron text not null default '0 2 * * *',
  timezone text not null default 'Asia/Kolkata',
  include_db boolean not null default true,
  include_r2_metadata boolean not null default true,
  include_settings boolean not null default true,
  retain_days int not null default 30 check (retain_days >= 1 and retain_days <= 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backup_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.backup_jobs (id) on delete set null,
  trigger text not null check (trigger in ('cron', 'manual')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  actor_id uuid,
  storage_key text,
  manifest_storage_key text,
  file_url text,
  byte_size bigint,
  tables_exported text[] not null default '{}',
  row_counts jsonb not null default '{}'::jsonb,
  r2_keys_count int not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists backup_runs_started_idx
  on public.backup_runs (started_at desc);

create index if not exists backup_runs_status_idx
  on public.backup_runs (status, started_at desc);

alter table public.backup_jobs enable row level security;
alter table public.backup_runs enable row level security;

drop policy if exists "backup_jobs_deny_all" on public.backup_jobs;
create policy "backup_jobs_deny_all"
  on public.backup_jobs for all using (false) with check (false);

drop policy if exists "backup_runs_deny_all" on public.backup_runs;
create policy "backup_runs_deny_all"
  on public.backup_runs for all using (false) with check (false);

-- Seed default nightly job (idempotent)
insert into public.backup_jobs (name, enabled, cron, timezone)
select 'default', true, '0 2 * * *', 'Asia/Kolkata'
where not exists (select 1 from public.backup_jobs where name = 'default');

comment on table public.backup_jobs is 'Backup schedule / policy (Module 12).';
comment on table public.backup_runs is 'Backup execution history + R2 archive pointers.';
