-- Categories may open an external / social link on tap (optional).
-- Empty link_url → student app still filters courses by category.

alter table public.categories
  add column if not exists link_url text;

comment on column public.categories.link_url is
  'Optional external URL (social / website). When set, student tap opens this link.';
