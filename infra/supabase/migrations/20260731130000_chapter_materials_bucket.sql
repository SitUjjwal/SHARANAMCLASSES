-- Public bucket for chapter notes / PDF uploads (admin panel)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chapter-materials',
  'chapter-materials',
  true,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read chapter materials" on storage.objects;
create policy "Public read chapter materials"
  on storage.objects
  for select
  to public
  using (bucket_id = 'chapter-materials');

drop policy if exists "Authenticated upload chapter materials" on storage.objects;
create policy "Authenticated upload chapter materials"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'chapter-materials');
