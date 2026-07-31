-- Dedicated PDF catalog — binary lives in Cloudflare R2; Postgres stores URL + metadata only
create table if not exists public.pdfs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  title text not null,
  description text not null default '',
  file_url text not null,
  storage_key text not null,
  file_size bigint not null default 0 check (file_size >= 0),
  mime_type text not null default 'application/pdf',
  original_filename text not null default '',
  sort_order int not null default 0,
  is_free boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pdfs_mime_pdf check (mime_type = 'application/pdf')
);

create index if not exists pdfs_course_idx on public.pdfs (course_id, sort_order);
create index if not exists pdfs_chapter_idx on public.pdfs (chapter_id, sort_order);
create index if not exists pdfs_storage_key_idx on public.pdfs (storage_key);

alter table public.pdfs enable row level security;

drop policy if exists "Authenticated read published pdfs" on public.pdfs;
create policy "Authenticated read published pdfs"
  on public.pdfs
  for select
  to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = pdfs.chapter_id
        and ch.is_published = true
        and c.is_published = true
    )
  );

comment on table public.pdfs is 'Course chapter PDFs — file binary in Cloudflare R2; URL + metadata in Postgres';
comment on column public.pdfs.file_url is 'Public CDN URL returned after R2 upload';
comment on column public.pdfs.storage_key is 'R2 object key (used for delete/replace)';
