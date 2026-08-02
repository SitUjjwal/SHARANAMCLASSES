-- Module 7: Reminder Engine — idempotent dispatch ledger + schedule/expiry signals.

-- Idempotency: one send per (entity, reminder_key)
create table if not exists public.reminder_dispatches (
  id uuid primary key default gen_random_uuid(),
  reminder_type text not null
    check (reminder_type in (
      'live_class_upcoming',
      'test_tomorrow',
      'course_expiry',
      'new_chapter',
      'missed_class'
    )),
  entity_type text not null,
  entity_id uuid not null,
  reminder_key text not null,
  notification_id uuid references public.notifications (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  unique (reminder_type, entity_id, reminder_key)
);

create index if not exists reminder_dispatches_type_sent_idx
  on public.reminder_dispatches (reminder_type, sent_at desc);

alter table public.reminder_dispatches enable row level security;

drop policy if exists "reminder_dispatches_deny_all" on public.reminder_dispatches;
create policy "reminder_dispatches_deny_all"
  on public.reminder_dispatches
  for all
  using (false)
  with check (false);

comment on table public.reminder_dispatches is
  'Reminder Engine ledger — prevents duplicate scheduled notification sends';

-- Expand notification_type for expiry / missed class
alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications
  add constraint notifications_notification_type_check
  check (notification_type in (
    'general',
    'live_class',
    'course_update',
    'test_reminder',
    'announcement',
    'course_expiry',
    'missed_class'
  ));

-- Tomorrow's tests: optional schedule (null = not scheduled)
alter table public.tests
  add column if not exists scheduled_at timestamptz;

create index if not exists tests_scheduled_at_idx
  on public.tests (scheduled_at)
  where is_published = true and scheduled_at is not null;

comment on column public.tests.scheduled_at is
  'When the test is due / opens — Reminder Engine sends day-before alerts';

-- Course expiry on purchase ledger (null = never expires)
alter table public.purchased_courses
  add column if not exists expires_at timestamptz;

create index if not exists purchased_courses_expires_at_idx
  on public.purchased_courses (expires_at)
  where expires_at is not null;

comment on column public.purchased_courses.expires_at is
  'Access end time — Reminder Engine warns before expiry';
