-- Batch → Subject → Chapter architecture.
--
-- Design decision (data-preserving): the existing `courses` table IS the batch.
-- All payments, enrollments, purchased_courses, RLS and the released mobile app
-- key on courses.id, so we extend courses with batch fields instead of creating
-- a parallel `batches` table. A `batches` view is provided for reporting.
--
-- New:
--   subjects        — master subject catalog (Hindi, Maths, …)
--   batch_subjects  — many-to-many batch(course) ↔ subject with teacher/order
--   chapters.batch_subject_id — chapter now belongs to a subject inside a batch
--   tests.batch_subject_id    — tests attachable at subject level
--   live_classes.subject_id / chapter_id — live class under batch → subject

-- ---------------------------------------------------------------------------
-- courses (batch) — pricing window fields
-- ---------------------------------------------------------------------------
alter table public.courses
  add column if not exists original_price numeric(10,2),
  add column if not exists discount_percent numeric(5,2)
    check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  add column if not exists start_date date,
  add column if not exists end_date date;

-- ---------------------------------------------------------------------------
-- subjects — master catalog
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  description text not null default '',
  icon_url text,
  thumbnail_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subjects_name_unique_idx
  on public.subjects (lower(name));

-- ---------------------------------------------------------------------------
-- batch_subjects — batch(course) ↔ subject
-- ---------------------------------------------------------------------------
create table if not exists public.batch_subjects (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.courses (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, subject_id)
);

create index if not exists batch_subjects_batch_idx
  on public.batch_subjects (batch_id, sort_order);
create index if not exists batch_subjects_subject_idx
  on public.batch_subjects (subject_id);

-- ---------------------------------------------------------------------------
-- chapters — belong to a subject inside a batch (nullable for legacy courses)
-- ---------------------------------------------------------------------------
alter table public.chapters
  add column if not exists batch_subject_id uuid
    references public.batch_subjects (id) on delete set null;

create index if not exists chapters_batch_subject_idx
  on public.chapters (batch_subject_id, sort_order);

-- ---------------------------------------------------------------------------
-- tests — attachable to batch (course_id), subject (batch_subject_id) or chapter
-- ---------------------------------------------------------------------------
alter table public.tests
  add column if not exists batch_subject_id uuid
    references public.batch_subjects (id) on delete set null;

create index if not exists tests_batch_subject_idx
  on public.tests (batch_subject_id);

-- ---------------------------------------------------------------------------
-- live_classes — batch (course_id already exists) + subject + optional chapter
-- ---------------------------------------------------------------------------
alter table public.live_classes
  add column if not exists subject_id uuid
    references public.subjects (id) on delete set null,
  add column if not exists chapter_id uuid
    references public.chapters (id) on delete set null;

create index if not exists live_classes_subject_idx
  on public.live_classes (subject_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subjects enable row level security;
alter table public.batch_subjects enable row level security;

drop policy if exists "subjects_read_active" on public.subjects;
create policy "subjects_read_active" on public.subjects
  for select to authenticated using (status = 'active');

drop policy if exists "batch_subjects_read_active" on public.batch_subjects;
create policy "batch_subjects_read_active" on public.batch_subjects
  for select to authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.courses c
      where c.id = batch_id and c.is_published = true
    )
  );

-- ---------------------------------------------------------------------------
-- Data migration — courses.subject (text) → subjects + batch_subjects,
-- and link that course's chapters to the new batch_subject.
-- ---------------------------------------------------------------------------
do $$
declare
  crs record;
  subj_id uuid;
  bs_id uuid;
begin
  for crs in
    select id, subject, teacher_id
    from public.courses
    where subject is not null and btrim(subject) <> ''
  loop
    insert into public.subjects (name)
    values (btrim(crs.subject))
    on conflict (lower(name)) do nothing;

    select id into subj_id
    from public.subjects
    where lower(name) = lower(btrim(crs.subject));

    insert into public.batch_subjects (batch_id, subject_id, teacher_id, sort_order)
    values (crs.id, subj_id, crs.teacher_id, 0)
    on conflict (batch_id, subject_id) do nothing;

    select id into bs_id
    from public.batch_subjects
    where batch_id = crs.id and subject_id = subj_id;

    update public.chapters
    set batch_subject_id = bs_id
    where course_id = crs.id and batch_subject_id is null;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed common Bihar Board subjects (idempotent)
-- ---------------------------------------------------------------------------
insert into public.subjects (name, code)
values
  ('Hindi', 'HIN'),
  ('English', 'ENG'),
  ('Mathematics', 'MAT'),
  ('Science', 'SCI'),
  ('Social Science', 'SST'),
  ('Sanskrit', 'SAN'),
  ('Urdu', 'URD'),
  ('Physics', 'PHY'),
  ('Chemistry', 'CHE'),
  ('Biology', 'BIO'),
  ('History', 'HIS'),
  ('Geography', 'GEO'),
  ('Economics', 'ECO'),
  ('Accountancy', 'ACC'),
  ('Business Studies', 'BST')
on conflict (lower(name)) do nothing;

-- ---------------------------------------------------------------------------
-- batches view — reporting alias over courses
-- ---------------------------------------------------------------------------
create or replace view public.batches as
select
  id,
  title as name,
  board,
  class_level as class,
  academic_year,
  medium,
  stream,
  description,
  thumbnail_url,
  price,
  original_price,
  discount_percent,
  start_date,
  end_date,
  case when is_published then 'published' else 'draft' end as status,
  created_at,
  updated_at
from public.courses;
