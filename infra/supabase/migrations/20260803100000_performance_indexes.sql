-- Performance indexes for hot list / filter paths (idempotent)

-- Videos: published filters within a course
CREATE INDEX IF NOT EXISTS idx_videos_course_published_sort
  ON public.videos (course_id, is_published, sort_order);

CREATE INDEX IF NOT EXISTS idx_videos_published
  ON public.videos (is_published)
  WHERE is_published = true;

-- Payment admin / student history
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created
  ON public.payment_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created
  ON public.payment_orders (user_id, created_at DESC);

-- Activity log actor / entity lookups
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor_created
  ON public.admin_activity_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_entity
  ON public.admin_activity_logs (entity_type, entity_id);

-- Profiles: role listing
CREATE INDEX IF NOT EXISTS idx_profiles_role_created
  ON public.profiles (role, created_at DESC);

-- Enrollments: my-courses ordering
CREATE INDEX IF NOT EXISTS idx_enrollments_user_last_watched
  ON public.enrollments (user_id, last_watched_at DESC NULLS LAST);

-- Tests public list
CREATE INDEX IF NOT EXISTS idx_tests_published_sort
  ON public.tests (is_published, sort_order)
  WHERE is_published = true;

-- Live classes public timeline
CREATE INDEX IF NOT EXISTS idx_live_classes_published_start
  ON public.live_classes (is_published, start_time)
  WHERE is_published = true;
