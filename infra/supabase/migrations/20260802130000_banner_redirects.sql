-- Module 7: Banner redirect targets (Course / Test / Live Class / Website).
-- Keeps existing redirect_url for external website links.

alter table public.banners
  add column if not exists redirect_type text not null default 'none'
    check (redirect_type in ('none', 'course', 'test', 'live_class', 'website'));

alter table public.banners
  add column if not exists redirect_target_id uuid;

-- Existing rows with a URL become website redirects.
update public.banners
set redirect_type = 'website'
where redirect_url is not null
  and length(trim(redirect_url)) > 0
  and redirect_type = 'none';

comment on column public.banners.redirect_type is
  'Banner tap target: none | course | test | live_class | website';
comment on column public.banners.redirect_target_id is
  'Target entity id when redirect_type is course, test, or live_class';
