-- Teacher assignment on live classes (Module teacher management)

alter table public.live_classes
  add column if not exists teacher_id uuid references public.profiles (id) on delete set null;

create index if not exists live_classes_teacher_id_idx
  on public.live_classes (teacher_id);

comment on column public.live_classes.teacher_id is
  'Instructor assigned to host this live class (profiles.instructor/admin)';
