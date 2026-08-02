-- Module 7: Notification service — saved messages + per-device delivery status.
-- Audience resolution:
--   single_user → audience_user_id
--   all_users   → all profiles
--   class       → profiles.class_level
--   course      → enrollments.course_id

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  deep_link text,
  data jsonb not null default '{}'::jsonb,
  notification_type text not null default 'general'
    check (notification_type in (
      'general',
      'live_class',
      'course_update',
      'test_reminder',
      'announcement'
    )),
  audience_type text not null
    check (audience_type in ('single_user', 'all_users', 'class', 'course')),
  audience_user_id uuid references auth.users (id) on delete set null,
  audience_class_level text
    check (
      audience_class_level is null
      or audience_class_level in (
        '6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'
      )
    ),
  audience_course_id uuid references public.courses (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'partial', 'failed')),
  target_user_count integer not null default 0,
  push_success_count integer not null default 0,
  push_failure_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_audience_shape check (
    (audience_type = 'single_user' and audience_user_id is not null)
    or (audience_type = 'all_users')
    or (audience_type = 'class' and audience_class_level is not null)
    or (audience_type = 'course' and audience_course_id is not null)
  )
);

create index if not exists notifications_status_created_idx
  on public.notifications (status, created_at desc);

create index if not exists notifications_audience_course_idx
  on public.notifications (audience_course_id)
  where audience_type = 'course';

create index if not exists notifications_audience_class_idx
  on public.notifications (audience_class_level)
  where audience_type = 'class';

-- One row per device push attempt (or skipped_no_token for users without devices).
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_token_id uuid references public.device_push_tokens (id) on delete set null,
  provider text check (provider is null or provider in ('fcm', 'apns', 'expo')),
  token text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped_no_token')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_deliveries_notification_idx
  on public.notification_deliveries (notification_id);

create index if not exists notification_deliveries_user_idx
  on public.notification_deliveries (user_id, created_at desc);

create index if not exists notification_deliveries_status_idx
  on public.notification_deliveries (notification_id, status);

alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;

-- Students never touch these tables directly — API uses service role.
drop policy if exists "notifications_deny_all" on public.notifications;
create policy "notifications_deny_all"
  on public.notifications
  for all
  using (false)
  with check (false);

drop policy if exists "notification_deliveries_deny_all" on public.notification_deliveries;
create policy "notification_deliveries_deny_all"
  on public.notification_deliveries
  for all
  using (false)
  with check (false);

comment on table public.notifications is
  'Saved push/in-app notification campaigns with audience targeting';
comment on table public.notification_deliveries is
  'Per-device (or per-user skip) delivery status for each notification send';
