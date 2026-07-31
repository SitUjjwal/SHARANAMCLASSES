-- Seed Home Dashboard content before Admin Panel exists.
-- Safe to re-run. Categories are matched by slug (not fixed IDs).

-- 1) Subject categories
insert into public.categories (name, slug, icon, sort_order, is_active)
values
  ('Maths', 'maths', '📘', 10, true),
  ('Science', 'science', '🧪', 20, true),
  ('English', 'english', '📙', 30, true),
  ('Social', 'social', '🌎', 40, true)
on conflict (slug) do update
set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

update public.categories
set is_active = false
where slug in (
  'class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12',
  'competitive', 'computer'
);

-- 2) Banners (id, title, image, redirect_url, status, sort_order)
insert into public.banners (id, title, subtitle, image, redirect_url, sort_order, status)
values
  (
    'b1000000-0000-4000-8000-000000000001',
    'SHARANAM CLASSES',
    'Quality coaching for Board & Competitive exams',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    null,
    10,
    'active'
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'New Maths Batch',
    'Class 9–12 · Hindi & English medium',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    null,
    20,
    'active'
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'Science Practical Focus',
    'Concept clarity with regular tests',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    null,
    30,
    'active'
  )
on conflict (id) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  image = excluded.image,
  redirect_url = excluded.redirect_url,
  sort_order = excluded.sort_order,
  status = 'active';

-- 3) Quote
insert into public.motivational_quotes (id, quote_text, author, is_active)
values (
  'f1000000-0000-4000-8000-000000000001',
  'Success is the sum of small efforts repeated every day.',
  'SHARANAM CLASSES',
  true
)
on conflict (id) do update
set
  quote_text = excluded.quote_text,
  author = excluded.author,
  is_active = true;

-- 4) Featured courses (category via slug lookup)
insert into public.courses (
  id, category_id, title, slug, description, thumbnail_url,
  class_level, medium, is_featured, is_published, sort_order, updated_at
)
select
  'c1000000-0000-4000-8000-000000000001',
  c.id,
  'Class 10 Maths Complete',
  'class-10-maths-complete',
  'Full Class 10 Mathematics: algebra, geometry, trigonometry and board practice.',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
  '10',
  'hindi',
  true,
  true,
  10,
  now()
from public.categories c
where c.slug = 'maths'
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  is_featured = true,
  is_published = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.courses (
  id, category_id, title, slug, description, thumbnail_url,
  class_level, medium, is_featured, is_published, sort_order, updated_at
)
select
  'c1000000-0000-4000-8000-000000000002',
  c.id,
  'Class 10 Science',
  'class-10-science',
  'Physics, Chemistry and Biology for Class 10 with NCERT focus.',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  '10',
  'english',
  true,
  true,
  20,
  now()
from public.categories c
where c.slug = 'science'
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  is_featured = true,
  is_published = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.courses (
  id, category_id, title, slug, description, thumbnail_url,
  class_level, medium, is_featured, is_published, sort_order, updated_at
)
select
  'c1000000-0000-4000-8000-000000000003',
  c.id,
  'English Grammar Foundations',
  'english-grammar-foundations',
  'Grammar, writing and comprehension for school exams.',
  'https://images.unsplash.com/photo-1456513080080-7b4f2c8c8a8b?auto=format&fit=crop&w=800&q=80',
  '9',
  'english',
  true,
  true,
  30,
  now()
from public.categories c
where c.slug = 'english'
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  is_featured = true,
  is_published = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.courses (
  id, category_id, title, slug, description, thumbnail_url,
  class_level, medium, is_featured, is_published, sort_order, updated_at
)
select
  'c1000000-0000-4000-8000-000000000004',
  c.id,
  'Social Science Class 10',
  'social-science-class-10',
  'History, Geography, Civics and Economics overview for Class 10.',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
  '10',
  'hindi',
  true,
  true,
  40,
  now()
from public.categories c
where c.slug = 'social'
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  is_featured = true,
  is_published = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 5) Chapters (matched by course slug → id)
insert into public.chapters (id, course_id, title, description, sort_order, is_free_preview, is_published, updated_at)
select v.id, c.id, v.title, v.description, v.sort_order, v.is_free_preview, true, now()
from (
  values
    ('d1000000-0000-4000-8000-000000000001'::uuid, 'class-10-maths-complete', 'Real Numbers', 'NCERT Chapter 1 overview', 10, true),
    ('d1000000-0000-4000-8000-000000000002'::uuid, 'class-10-maths-complete', 'Polynomials', 'NCERT Chapter 2 overview', 20, false),
    ('d1000000-0000-4000-8000-000000000003'::uuid, 'class-10-maths-complete', 'Pair of Linear Equations', 'NCERT Chapter 3 overview', 30, false),
    ('d1000000-0000-4000-8000-000000000011'::uuid, 'class-10-science', 'Chemical Reactions', 'Intro to chemical reactions', 10, true),
    ('d1000000-0000-4000-8000-000000000012'::uuid, 'class-10-science', 'Light — Reflection', 'Optics basics', 20, false),
    ('d1000000-0000-4000-8000-000000000013'::uuid, 'class-10-science', 'Life Processes', 'Biology fundamentals', 30, false),
    ('d1000000-0000-4000-8000-000000000021'::uuid, 'english-grammar-foundations', 'Parts of Speech', 'Grammar essentials', 10, true),
    ('d1000000-0000-4000-8000-000000000022'::uuid, 'english-grammar-foundations', 'Tenses', 'Present, past, future', 20, false),
    ('d1000000-0000-4000-8000-000000000031'::uuid, 'social-science-class-10', 'Nationalism in India', 'History overview', 10, true),
    ('d1000000-0000-4000-8000-000000000032'::uuid, 'social-science-class-10', 'Resources and Development', 'Geography overview', 20, false)
) as v(id, course_slug, title, description, sort_order, is_free_preview)
join public.courses c on c.slug = v.course_slug
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_free_preview = excluded.is_free_preview,
  is_published = true,
  updated_at = now();

-- 6) Latest updates
insert into public.app_updates (id, title, body, is_published, published_at)
values
  (
    'e1000000-0000-4000-8000-000000000001',
    'Welcome to SHARANAM CLASSES',
    'Your learning app is ready. Browse categories and featured courses from the Home screen.',
    true,
    now()
  ),
  (
    'e1000000-0000-4000-8000-000000000002',
    'Class 10 test series',
    'Weekly tests for Maths and Science start this Monday. Stay consistent!',
    true,
    now() - interval '1 day'
  )
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  is_published = true,
  published_at = excluded.published_at;
