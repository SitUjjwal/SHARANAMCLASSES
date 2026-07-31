-- Course card rating (0–5) for star display
alter table public.courses
  add column if not exists rating numeric(2, 1) not null default 4.0;

alter table public.courses
  drop constraint if exists courses_rating_check;

alter table public.courses
  add constraint courses_rating_check
  check (rating >= 0 and rating <= 5);

update public.courses
set
  rating = case
    when slug = 'class-10-maths-complete' then 4.0
    when slug = 'class-10-science' then 4.5
    when slug = 'english-grammar-foundations' then 4.0
    when slug = 'social-science-class-10' then 3.5
    else coalesce(rating, 4.0)
  end,
  price = case
    when slug = 'class-10-maths-complete' then 499
    else price
  end,
  teacher_name = coalesce(nullif(btrim(teacher_name), ''), 'SHARANAM Faculty')
where true;

comment on column public.courses.rating is 'Average course rating 0–5 for card star display';
