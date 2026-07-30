-- Student profiles linked 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_number text not null,
  class_level text not null check (class_level in ('9', '10', '11', '12')),
  medium text not null check (medium in ('hindi', 'english')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key on public.profiles (email);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile when a new auth user is registered (works even if email confirm disables session)
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
