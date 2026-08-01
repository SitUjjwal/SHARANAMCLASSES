-- Question bank for Test Series (MCQ with 4 options).
-- Belongs to public.tests; bulk Excel import writes rows here.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null
    check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text not null default '',
  marks numeric(10, 2) not null default 1 check (marks > 0),
  negative_marks numeric(10, 2) not null default 0 check (negative_marks >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_test_idx
  on public.questions (test_id, sort_order);

create index if not exists questions_test_created_idx
  on public.questions (test_id, created_at desc);

alter table public.questions enable row level security;

-- Students may read question stems for published tests; correct_answer
-- should only be used after attempt submit (API strips it for public list).
drop policy if exists "Authenticated read questions of published tests" on public.questions;
create policy "Authenticated read questions of published tests"
  on public.questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tests t
      where t.id = questions.test_id
        and t.is_published = true
    )
  );

comment on table public.questions is
  'MCQ question bank for a test — four options A–D, marks, negative marks';
comment on column public.questions.correct_answer is
  'A | B | C | D — never expose to student before attempt completion';
comment on column public.questions.negative_marks is
  'Marks deducted for wrong answer (0 = no negative marking)';
