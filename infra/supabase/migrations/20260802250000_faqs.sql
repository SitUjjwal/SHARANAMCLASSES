-- FAQ module — admin CRUD + sort; student search published FAQs

create extension if not exists pg_trgm;

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faqs_question_len check (char_length(trim(question)) >= 3),
  constraint faqs_answer_len check (char_length(trim(answer)) >= 3)
);

create index if not exists faqs_published_sort_idx
  on public.faqs (sort_order asc, created_at asc)
  where is_published = true;

create index if not exists faqs_admin_sort_idx
  on public.faqs (sort_order asc, created_at desc);

do $$
begin
  create index if not exists faqs_question_trgm_idx
    on public.faqs using gin (question gin_trgm_ops);
  create index if not exists faqs_answer_trgm_idx
    on public.faqs using gin (answer gin_trgm_ops);
exception
  when others then
    -- pg_trgm unavailable — student search still works via ilike
    null;
end $$;

alter table public.faqs enable row level security;

drop policy if exists "faqs_deny_all" on public.faqs;
create policy "faqs_deny_all"
  on public.faqs
  for all
  using (false)
  with check (false);

comment on table public.faqs is
  'Help center FAQs: admin CRUD/sort; students search published rows';

insert into public.faqs (question, answer, category, sort_order, is_published)
select v.question, v.answer, v.category, v.sort_order, v.is_published
from (values
  (
    'How do I access purchased courses?',
    'Open My Learning from the bottom tabs. All active enrollments appear there.',
    'courses',
    10,
    true
  ),
  (
    'How do certificates work?',
    'Complete a course to 100%, then request a certificate. An admin approves it before the PDF is issued.',
    'certificates',
    20,
    true
  ),
  (
    'I forgot my password.',
    'Use Forgot password on the login screen, or Change password in Settings while signed in.',
    'account',
    30,
    true
  ),
  (
    'How do I report a bug?',
    'Open Feedback & Support → Report a bug. Describe the issue, select the screen, and optionally attach a screenshot.',
    'app',
    40,
    true
  )
) as v(question, answer, category, sort_order, is_published)
where not exists (
  select 1 from public.faqs f where f.question = v.question
);
