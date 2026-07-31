-- Dedicated notes catalog — external HTTPS URL only (no file binary in DB)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  title text not null,
  description text not null default '',
  notes_url text not null,
  sort_order int not null default 0,
  is_free boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_course_idx on public.notes (course_id, sort_order);
create index if not exists notes_chapter_idx on public.notes (chapter_id, sort_order);

alter table public.notes enable row level security;

drop policy if exists "Authenticated read published notes" on public.notes;
create policy "Authenticated read published notes"
  on public.notes
  for select
  to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = notes.chapter_id
        and ch.is_published = true
        and c.is_published = true
    )
  );

comment on table public.notes is 'Course chapter notes — stores HTTPS notes URL only';
comment on column public.notes.notes_url is 'Public HTTPS link (Google Docs, Notion, Drive, etc.)';
