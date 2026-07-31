-- Ensure class_level exists, then allow Class 6–8 / competitive / computer.
-- Use this if profiles was created without class_level, or to expand the old 9–12 check.

-- 1) Add column when missing (safe if it already exists)
alter table public.profiles
  add column if not exists class_level text;

-- 2) Backfill any nulls so NOT NULL / check can apply
update public.profiles
set class_level = '9'
where class_level is null or btrim(class_level) = '';

-- 3) Enforce NOT NULL
alter table public.profiles
  alter column class_level set not null;

-- 4) Replace check constraint with the expanded allow-list
alter table public.profiles
  drop constraint if exists profiles_class_level_check;

alter table public.profiles
  add constraint profiles_class_level_check
  check (
    class_level in (
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      'competitive',
      'computer'
    )
  );
