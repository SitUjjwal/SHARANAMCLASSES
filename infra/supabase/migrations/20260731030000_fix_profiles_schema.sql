-- Fix / align public.profiles to the app schema.
-- Safe to re-run. Use this when CREATE TABLE IF NOT EXISTS skipped an old incomplete table.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);

-- Required columns (no-op if already present)
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists class_level text;
alter table public.profiles add column if not exists medium text;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

-- Defaults / backfills
update public.profiles set full_name = coalesce(nullif(btrim(full_name), ''), 'Student') where full_name is null or btrim(full_name) = '';
update public.profiles set email = coalesce(nullif(btrim(email), ''), id::text || '@unknown.local') where email is null or btrim(email) = '';
update public.profiles set phone_number = coalesce(nullif(btrim(phone_number), ''), '0000000000') where phone_number is null or btrim(phone_number) = '';
update public.profiles set class_level = '9' where class_level is null or btrim(class_level) = '';
update public.profiles set medium = 'hindi' where medium is null or btrim(medium) = '';
update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;

alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column email set not null;
alter table public.profiles alter column phone_number set not null;
alter table public.profiles alter column class_level set not null;
alter table public.profiles alter column medium set not null;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();
alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column updated_at set not null;

create unique index if not exists profiles_email_key on public.profiles (email);

-- Replace class_level / medium checks
alter table public.profiles drop constraint if exists profiles_class_level_check;
alter table public.profiles drop constraint if exists profiles_medium_check;

alter table public.profiles
  add constraint profiles_class_level_check
  check (
    class_level in (
      '6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'
    )
  );

alter table public.profiles
  add constraint profiles_medium_check
  check (medium in ('hindi', 'english'));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone_number,
    class_level,
    medium
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Student'),
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'phone_number', ''), '0000000000'),
    coalesce(nullif(new.raw_user_meta_data->>'class_level', ''), '9'),
    coalesce(nullif(new.raw_user_meta_data->>'medium', ''), 'hindi')
  )
  on conflict (id) do update
    set
      full_name = excluded.full_name,
      email = excluded.email,
      phone_number = excluded.phone_number,
      class_level = excluded.class_level,
      medium = excluded.medium,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
