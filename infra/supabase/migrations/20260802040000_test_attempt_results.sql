-- Persist scored attempt results (Result Screen).

alter table public.test_attempts
  add column if not exists obtained_marks numeric(10, 2),
  add column if not exists correct_count integer,
  add column if not exists wrong_count integer,
  add column if not exists skipped_count integer,
  add column if not exists percentage numeric(6, 2),
  add column if not exists is_passed boolean;

comment on column public.test_attempts.obtained_marks is
  'Net marks after positive + negative marking; set on submit';
comment on column public.test_attempts.percentage is
  'obtained_marks / tests.total_marks * 100 (clamped 0–100 for display)';
comment on column public.test_attempts.is_passed is
  'obtained_marks >= tests.passing_marks';
