-- RBAC staff roles on profiles.role
-- Roles: student | super_admin | admin | teacher | support
-- Legacy: instructor is kept and treated as teacher in the API/UI.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (
    role in (
      'student',
      'super_admin',
      'admin',
      'teacher',
      'instructor',
      'support'
    )
  );

comment on column public.profiles.role is
  'App role: student | super_admin | admin | teacher | support (instructor = legacy teacher alias)';
