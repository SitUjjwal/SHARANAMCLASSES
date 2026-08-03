-- Student account suspension flag for Admin Student Management

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

alter table public.profiles
  add column if not exists suspended_at timestamptz;

alter table public.profiles
  add column if not exists suspended_reason text;

create index if not exists profiles_student_suspended_idx
  on public.profiles (role, is_suspended)
  where role = 'student';

comment on column public.profiles.is_suspended is
  'Admin-managed suspension; paired with Auth ban when suspended';
