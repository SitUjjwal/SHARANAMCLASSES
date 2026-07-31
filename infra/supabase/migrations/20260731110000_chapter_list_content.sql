-- Chapter list metadata + content items (video / pdf / notes)
alter table public.chapters
  add column if not exists duration_seconds int not null default 0;

alter table public.chapters
  add column if not exists video_count int not null default 0;

alter table public.chapters
  add column if not exists pdf_count int not null default 0;

alter table public.chapters
  add column if not exists notes_count int not null default 0;

create table if not exists public.chapter_contents (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  content_type text not null check (content_type in ('video', 'pdf', 'note')),
  title text not null,
  url text,
  body text,
  duration_seconds int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists chapter_contents_chapter_idx
  on public.chapter_contents (chapter_id, sort_order);

alter table public.chapter_contents enable row level security;

drop policy if exists "Authenticated read chapter contents" on public.chapter_contents;
create policy "Authenticated read chapter contents"
  on public.chapter_contents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_contents.chapter_id
        and ch.is_published = true
        and c.is_published = true
    )
  );

-- Seed metadata for existing demo chapters
update public.chapters
set
  duration_seconds = case title
    when 'Real Numbers' then 2700
    when 'Polynomials' then 3200
    when 'Pair of Linear Equations' then 3600
    when 'Chemical Reactions' then 2400
    when 'Light — Reflection' then 3000
    when 'Life Processes' then 4200
    when 'Parts of Speech' then 1800
    when 'Tenses' then 2100
    when 'Nationalism in India' then 2500
    when 'Resources and Development' then 2800
    else 1800
  end,
  video_count = case when is_free_preview then 2 else 3 end,
  pdf_count = 1,
  notes_count = case when is_free_preview then 1 else 2 end
where true;

-- Sample content rows (idempotent by fixed ids)
insert into public.chapter_contents (
  id, chapter_id, content_type, title, url, body, duration_seconds, sort_order
)
select v.id, v.chapter_id, v.content_type, v.title, v.url, v.body, v.duration_seconds, v.sort_order
from (
  values
    (
      'f1000000-0000-4000-8000-000000000001'::uuid,
      'd1000000-0000-4000-8000-000000000001'::uuid,
      'video', 'Introduction to Real Numbers',
      'https://example.com/videos/real-numbers-1', null, 900, 10
    ),
    (
      'f1000000-0000-4000-8000-000000000002'::uuid,
      'd1000000-0000-4000-8000-000000000001'::uuid,
      'video', 'Euclid''s Division Lemma',
      'https://example.com/videos/real-numbers-2', null, 1200, 20
    ),
    (
      'f1000000-0000-4000-8000-000000000003'::uuid,
      'd1000000-0000-4000-8000-000000000001'::uuid,
      'pdf', 'Real Numbers Notes PDF',
      'https://example.com/pdfs/real-numbers.pdf', null, null, 30
    ),
    (
      'f1000000-0000-4000-8000-000000000004'::uuid,
      'd1000000-0000-4000-8000-000000000001'::uuid,
      'note', 'Key formulas',
      null, 'HCF × LCM = product of two numbers (for positive integers).', null, 40
    ),
    (
      'f1000000-0000-4000-8000-000000000011'::uuid,
      'd1000000-0000-4000-8000-000000000002'::uuid,
      'video', 'Polynomials overview',
      'https://example.com/videos/polynomials-1', null, 1100, 10
    ),
    (
      'f1000000-0000-4000-8000-000000000012'::uuid,
      'd1000000-0000-4000-8000-000000000002'::uuid,
      'pdf', 'Polynomials worksheet',
      'https://example.com/pdfs/polynomials.pdf', null, null, 20
    ),
    (
      'f1000000-0000-4000-8000-000000000013'::uuid,
      'd1000000-0000-4000-8000-000000000002'::uuid,
      'note', 'Degree tips',
      null, 'Degree of a non-zero polynomial is the highest power with non-zero coefficient.', null, 30
    )
) as v(id, chapter_id, content_type, title, url, body, duration_seconds, sort_order)
where exists (select 1 from public.chapters ch where ch.id = v.chapter_id)
on conflict (id) do update
set
  title = excluded.title,
  url = excluded.url,
  body = excluded.body,
  duration_seconds = excluded.duration_seconds,
  sort_order = excluded.sort_order;
