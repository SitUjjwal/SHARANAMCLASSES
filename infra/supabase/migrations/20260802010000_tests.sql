-- Test Series Management — exam metadata (questions are a follow-up module).
-- Types: chapter_test | subject_test | mock_test | previous_year | daily_quiz

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  instructions text not null default '',
  test_type text not null
    check (test_type in (
      'chapter_test',
      'subject_test',
      'mock_test',
      'previous_year',
      'daily_quiz'
    )),
  course_id uuid references public.courses (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  duration_minutes integer not null check (duration_minutes > 0),
  total_marks numeric(10, 2) not null check (total_marks > 0),
  passing_marks numeric(10, 2) not null check (passing_marks > 0),
  sort_order integer not null default 0,
  is_free boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tests_passing_lte_total check (passing_marks <= total_marks)
);

create index if not exists tests_course_idx
  on public.tests (course_id, sort_order);

create index if not exists tests_chapter_idx
  on public.tests (chapter_id, sort_order)
  where chapter_id is not null;

create index if not exists tests_type_idx
  on public.tests (test_type);

create index if not exists tests_published_idx
  on public.tests (is_published, created_at desc);

alter table public.tests enable row level security;

drop policy if exists "Authenticated read published tests" on public.tests;
create policy "Authenticated read published tests"
  on public.tests
  for select
  to authenticated
  using (
    is_published = true
    and (
      course_id is null
      or exists (
        select 1
        from public.courses c
        where c.id = tests.course_id
          and c.is_published = true
      )
    )
  );

comment on table public.tests is
  'Test Series catalog — duration, marks, type; questions stored in a later module';
comment on column public.tests.test_type is
  'chapter_test | subject_test | mock_test | previous_year | daily_quiz';
comment on column public.tests.duration_minutes is
  'Timed attempt length in minutes';
comment on column public.tests.passing_marks is
  'Minimum marks to pass; must be <= total_marks';
