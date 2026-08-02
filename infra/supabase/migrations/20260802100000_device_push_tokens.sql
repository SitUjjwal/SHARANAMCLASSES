-- Module 7: device push tokens for FCM / APNs / Expo Push
-- One row per physical device; upsert by (user_id, device_id).

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  token text not null,
  provider text not null check (provider in ('fcm', 'apns', 'expo')),
  platform text not null check (platform in ('ios', 'android', 'web')),
  app_version text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index if not exists device_push_tokens_user_active_idx
  on public.device_push_tokens (user_id)
  where is_active = true;

create index if not exists device_push_tokens_token_idx
  on public.device_push_tokens (token);

alter table public.device_push_tokens enable row level security;

-- Students never read/write tokens directly — API uses service role.
drop policy if exists "device_push_tokens_deny_all" on public.device_push_tokens;
create policy "device_push_tokens_deny_all"
  on public.device_push_tokens
  for all
  using (false)
  with check (false);

comment on table public.device_push_tokens is
  'FCM/APNs/Expo device tokens registered by the mobile app for push delivery';
