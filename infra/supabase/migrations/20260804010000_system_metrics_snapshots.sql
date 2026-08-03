-- Module 11: optional historical snapshots for the Monitoring dashboard.
create table if not exists public.system_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists system_metrics_snapshots_captured_idx
  on public.system_metrics_snapshots (captured_at desc);

alter table public.system_metrics_snapshots enable row level security;

drop policy if exists "system_metrics_snapshots_deny_all" on public.system_metrics_snapshots;
create policy "system_metrics_snapshots_deny_all"
  on public.system_metrics_snapshots
  for all
  using (false)
  with check (false);

comment on table public.system_metrics_snapshots is
  'Periodic metrics snapshots from the API process (Module 11 Monitoring).';
