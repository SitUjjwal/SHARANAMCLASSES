-- Event-driven notifications: allow payment campaign type.

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
    'missed_class',
    'payment'
  ));
