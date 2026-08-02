-- Student profile photo URL for Profile screen avatar.

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Optional HTTPS profile photo URL shown on Student Profile';
