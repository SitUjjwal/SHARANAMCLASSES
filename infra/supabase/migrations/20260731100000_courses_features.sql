-- Course detail: feature bullets shown on the Course Details screen
alter table public.courses
  add column if not exists features text[] not null default '{}';

update public.courses
set features = case
  when slug = 'class-10-maths-complete' then array[
    'Complete Class 10 Maths syllabus',
    'Board exam practice sets',
    'Doubt-friendly Hindi medium',
    'Lifetime access after purchase'
  ]
  when slug = 'class-10-science' then array[
    'Physics, Chemistry & Biology',
    'NCERT-focused lessons',
    'Diagrams and experiments explained',
    'Lifetime access after purchase'
  ]
  when slug = 'english-grammar-foundations' then array[
    'Grammar foundations',
    'Writing & comprehension',
    'Free to start',
    'Lifetime access'
  ]
  when slug = 'social-science-class-10' then array[
    'History, Geography, Civics, Economics',
    'Map work & case studies',
    'Board-oriented notes',
    'Lifetime access after purchase'
  ]
  else array[
    'Structured chapter videos',
    'Experienced SHARANAM faculty',
    'Mobile-friendly learning',
    'Lifetime access after purchase'
  ]
end
where coalesce(array_length(features, 1), 0) = 0;

comment on column public.courses.features is 'Bullet list of course features for the detail screen';
