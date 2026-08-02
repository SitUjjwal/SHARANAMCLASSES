-- Student Feedback tickets
-- Types: general | course | teacher | suggestion | complaint
-- Status tracking: open → in_progress → resolved | closed

create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  feedback_type text not null
    check (feedback_type in (
      'general',
      'course',
      'teacher',
      'suggestion',
      'complaint'
    )),
  title text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  course_id uuid references public.courses (id) on delete set null,
  teacher_id uuid references auth.users (id) on delete set null,
  course_title text,
  teacher_name text,
  admin_note text,
  resolved_at timestamptz,
  closed_at timestamptz,
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_feedback_title_len check (char_length(trim(title)) >= 3),
  constraint student_feedback_message_len check (char_length(trim(message)) >= 10),
  constraint student_feedback_ticket_number_unique unique (ticket_number)
);

create index if not exists student_feedback_user_idx
  on public.student_feedback (user_id, created_at desc);

create index if not exists student_feedback_admin_status_idx
  on public.student_feedback (status, created_at desc);

create index if not exists student_feedback_type_idx
  on public.student_feedback (feedback_type, created_at desc);

-- Sequential ticket numbers FBYYYY##### (e.g. FB202600001)
create sequence if not exists public.student_feedback_ticket_seq;

create or replace function public.next_feedback_ticket_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.student_feedback_ticket_seq');
  return 'FB' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || lpad(n::text, 5, '0');
end;
$$;

alter table public.student_feedback enable row level security;

drop policy if exists "student_feedback_deny_all" on public.student_feedback;
create policy "student_feedback_deny_all"
  on public.student_feedback
  for all
  using (false)
  with check (false);

comment on table public.student_feedback is
  'Student feedback tickets: general/course/teacher/suggestion/complaint with status tracking';
