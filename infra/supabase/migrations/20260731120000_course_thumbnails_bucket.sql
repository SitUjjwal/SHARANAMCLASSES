-- Public bucket for course thumbnail uploads (admin panel)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-thumbnails',
  'course-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for thumbnails
drop policy if exists "Public read course thumbnails" on storage.objects;
create policy "Public read course thumbnails"
  on storage.objects
  for select
  to public
  using (bucket_id = 'course-thumbnails');

-- Service role / authenticated uploads are handled via API service key (bypasses RLS).
-- Keep an authenticated insert policy for future direct uploads if needed.
drop policy if exists "Authenticated upload course thumbnails" on storage.objects;
create policy "Authenticated upload course thumbnails"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'course-thumbnails');
