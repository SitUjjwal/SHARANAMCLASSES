-- Align banners table with admin/test schema:
-- id, title, image, redirect_url, status, sort_order
-- (subtitle kept optional for UI overlay text)

-- 1) Drop policy that depends on is_active BEFORE dropping the column
drop policy if exists "banners_read_active" on public.banners;

-- 2) Add new columns
alter table public.banners
  add column if not exists image text;

alter table public.banners
  add column if not exists redirect_url text;

alter table public.banners
  add column if not exists status text;

-- 3) Copy from legacy columns when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'banners' and column_name = 'image_url'
  ) then
    update public.banners
    set image = coalesce(nullif(image, ''), image_url)
    where image is null or btrim(image) = '';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'banners' and column_name = 'link_url'
  ) then
    update public.banners
    set redirect_url = coalesce(redirect_url, link_url);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'banners' and column_name = 'is_active'
  ) then
    update public.banners
    set status = case when is_active then 'active' else 'inactive' end
    where status is null or btrim(status) = '';
  end if;
end $$;

update public.banners
set status = 'active'
where status is null or btrim(status) = '';

update public.banners
set image = coalesce(
  nullif(btrim(image), ''),
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
)
where image is null or btrim(image) = '';

alter table public.banners
  alter column image set not null;

alter table public.banners
  alter column status set default 'active';

alter table public.banners
  alter column status set not null;

alter table public.banners
  drop constraint if exists banners_status_check;

alter table public.banners
  add constraint banners_status_check
  check (status in ('active', 'inactive'));

-- 4) Drop legacy columns (policy already removed)
alter table public.banners drop column if exists image_url;
alter table public.banners drop column if exists link_url;
alter table public.banners drop column if exists is_active;

-- 5) Recreate RLS on status
create policy "banners_read_active" on public.banners
  for select to authenticated
  using (status = 'active');
