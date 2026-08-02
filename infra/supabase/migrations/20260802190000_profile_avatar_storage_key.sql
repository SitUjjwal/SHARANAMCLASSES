-- Track R2 object key so profile photo replacements can delete the old object.

alter table public.profiles
  add column if not exists avatar_storage_key text;

comment on column public.profiles.avatar_storage_key is
  'Cloudflare R2 object key for avatar_url (avatars/{userId}/…)';
