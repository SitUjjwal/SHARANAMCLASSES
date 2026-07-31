-- Home categories: subjects (Maths, Science, English, Social)
-- Replaces class-level category seeds for the expected Home layout.

-- Soft-deactivate old class-based categories (keep rows for any linked courses)
update public.categories
set is_active = false
where slug in (
  'class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12',
  'competitive', 'computer'
);

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
