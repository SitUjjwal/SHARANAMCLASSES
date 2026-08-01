-- Test attempts — in-progress sessions + per-question answers (auto-save).
-- Scoring / submit results ship in a follow-up module.

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id uuid not null references public.tests (id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  current_question_index integer not null default 0
    check (current_question_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_attempts_user_idx
  on public.test_attempts (user_id, started_at desc);

create index if not exists test_attempts_test_idx
  on public.test_attempts (test_id);

-- One active attempt per student per test
create unique index if not exists test_attempts_one_in_progress
  on public.test_attempts (user_id, test_id)
  where status = 'in_progress';

create table if not exists public.test_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_answer text
    check (selected_answer is null or selected_answer in ('A', 'B', 'C', 'D')),
  is_marked_for_review boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists test_attempt_answers_attempt_idx
  on public.test_attempt_answers (attempt_id);

alter table public.test_attempts enable row level security;
alter table public.test_attempt_answers enable row level security;

drop policy if exists "Students read own attempts" on public.test_attempts;
create policy "Students read own attempts"
  on public.test_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Students read own attempt answers" on public.test_attempt_answers;
create policy "Students read own attempt answers"
  on public.test_attempt_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.test_attempts a
      where a.id = test_attempt_answers.attempt_id
        and a.user_id = auth.uid()
    )
  );

comment on table public.test_attempts is
  'Student timed test session; answers auto-saved while in_progress';
comment on table public.test_attempt_answers is
  'Per-question selection + mark-for-review flags for an attempt';
comment on column public.test_attempts.ends_at is
  'started_at + tests.duration_minutes — client timer + server expiry gate';
