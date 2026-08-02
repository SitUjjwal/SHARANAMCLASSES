-- Module 7: per-user notification inbox (read / delete / badge / pagination).
-- One row per (user, notification). Populated when a campaign is sent.

create table if not exists public.notification_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id uuid not null references public.notifications (id) on delete cascade,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, notification_id)
);

create index if not exists notification_inbox_user_created_idx
  on public.notification_inbox (user_id, created_at desc)
  where deleted_at is null;

create index if not exists notification_inbox_user_unread_idx
  on public.notification_inbox (user_id)
  where deleted_at is null and read_at is null;

alter table public.notification_inbox enable row level security;

drop policy if exists "notification_inbox_deny_all" on public.notification_inbox;
create policy "notification_inbox_deny_all"
  on public.notification_inbox
  for all
  using (false)
  with check (false);

comment on table public.notification_inbox is
  'Student notification center rows: unread badge, mark read, soft delete';

-- Backfill from existing deliveries (one inbox row per user+notification).
insert into public.notification_inbox (user_id, notification_id, created_at)
select distinct d.user_id, d.notification_id, min(d.created_at)
from public.notification_deliveries d
group by d.user_id, d.notification_id
on conflict (user_id, notification_id) do nothing;
