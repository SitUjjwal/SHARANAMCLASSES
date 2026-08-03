-- Admin activity logs + platform settings (Module 10)

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_idx
  on public.admin_activity_logs (created_at desc);

create index if not exists admin_activity_logs_action_idx
  on public.admin_activity_logs (action, created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "admin_activity_logs_deny_all" on public.admin_activity_logs;
create policy "admin_activity_logs_deny_all"
  on public.admin_activity_logs
  for all using (false) with check (false);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_deny_all" on public.platform_settings;
create policy "platform_settings_deny_all"
  on public.platform_settings
  for all using (false) with check (false);

insert into public.platform_settings (key, value)
values
  (
    'general',
    jsonb_build_object(
      'app_name', 'SHARANAM CLASSES',
      'support_email', 'support@sharanamclasses.com',
      'support_phone', '',
      'maintenance_mode', false,
      'timezone', 'Asia/Kolkata'
    )
  )
on conflict (key) do nothing;

comment on table public.admin_activity_logs is
  'Audit trail of admin/system actions for Activity Logs page';
comment on table public.platform_settings is
  'Key/value platform settings for Admin Settings page';
