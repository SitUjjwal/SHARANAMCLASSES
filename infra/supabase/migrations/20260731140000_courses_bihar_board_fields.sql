-- Bihar Board course taxonomy for reliable filtering:
-- Class 10 → Hindi Medium | Class 12 → Science → Physics | Bihar Board → 2026-2027 batch
--
-- Keeps existing class_level + medium (class_level = class).
-- Adds: stream, board, academic_year, subject, teacher_id, language

alter table public.courses
  add column if not exists stream text;

alter table public.courses
  add column if not exists board text;

alter table public.courses
  add column if not exists academic_year text;

alter table public.courses
  add column if not exists subject text;

alter table public.courses
  add column if not exists teacher_id uuid;

alter table public.courses
  add column if not exists language text;

-- Defaults / backfill
update public.courses
set board = 'bihar_board'
where board is null or btrim(board) = '';

update public.courses
set academic_year = '2026-2027'
where academic_year is null or btrim(academic_year) = '';

update public.courses
set language = medium
where language is null and medium is not null;

alter table public.courses
  alter column board set default 'bihar_board';

alter table public.courses
  alter column academic_year set default '2026-2027';

-- Constraints (drop + add for idempotency)
alter table public.courses
  drop constraint if exists courses_stream_check;

alter table public.courses
  add constraint courses_stream_check
  check (
    stream is null
    or stream in ('science', 'arts', 'commerce')
  );

alter table public.courses
  drop constraint if exists courses_board_check;

alter table public.courses
  add constraint courses_board_check
  check (
    board is null
    or board in ('bihar_board', 'other')
  );

alter table public.courses
  drop constraint if exists courses_language_check;

alter table public.courses
  add constraint courses_language_check
  check (
    language is null
    or language in ('hindi', 'english')
  );

-- Stream only meaningful for 11–12 (nullable for 9–10); no hard DB block so competitive/computer stay flexible.
-- Soft rule enforced in admin UI.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_teacher_id_fkey'
  ) then
    alter table public.courses
      add constraint courses_teacher_id_fkey
      foreign key (teacher_id) references public.profiles (id) on delete set null;
  end if;
end $$;

create index if not exists courses_class_medium_idx
  on public.courses (class_level, medium);

create index if not exists courses_class_stream_subject_idx
  on public.courses (class_level, stream, subject);

create index if not exists courses_board_year_idx
  on public.courses (board, academic_year);

create index if not exists courses_teacher_id_idx
  on public.courses (teacher_id);

comment on column public.courses.class_level is 'Class / grade (9, 10, 11, 12, …)';
comment on column public.courses.stream is 'Science | Arts | Commerce — typically for class 11–12';
comment on column public.courses.board is 'Exam board, default bihar_board';
comment on column public.courses.academic_year is 'Batch year e.g. 2026-2027';
comment on column public.courses.subject is 'Subject name e.g. Physics, Maths';
comment on column public.courses.teacher_id is 'FK to profiles (instructor/admin)';
comment on column public.courses.language is 'Content language; usually matches medium';
