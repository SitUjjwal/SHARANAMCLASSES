-- Probe table for GET /database-status connectivity checks.
create table if not exists public.app_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_meta (key, value)
values ('database', 'ok')
on conflict (key) do nothing;

alter table public.app_meta enable row level security;

-- Service role bypasses RLS; no public policies on purpose.
