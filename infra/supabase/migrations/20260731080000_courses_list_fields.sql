-- Course list commerce fields: teacher, price, free flag
alter table public.courses
  add column if not exists teacher_name text;

alter table public.courses
  add column if not exists price numeric(10, 2) not null default 0;

alter table public.courses
  add column if not exists is_free boolean not null default false;

-- Free courses stay at price 0; paid get a sample price for seeded catalog
update public.courses
set
  teacher_name = coalesce(teacher_name, 'SHARANAM Faculty'),
  is_free = case
    when slug in ('english-grammar-foundations') then true
    else coalesce(is_free, false)
  end,
  price = case
    when slug = 'english-grammar-foundations' then 0
    when slug = 'class-10-maths-complete' then 999
    when slug = 'class-10-science' then 1299
    when slug = 'social-science-class-10' then 799
    else greatest(price, 0)
  end
where true;

comment on column public.courses.teacher_name is 'Display name of the course teacher / instructor';
comment on column public.courses.price is 'List price in INR; 0 when is_free';
comment on column public.courses.is_free is 'When true, course is free to enroll (no payment)';
