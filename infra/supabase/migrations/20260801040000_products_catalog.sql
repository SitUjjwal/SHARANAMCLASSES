-- Generic sellable catalog for courses, test series, ebooks, spoken English, etc.
-- Orders/payments reference products.id; product_type + product_id point at the entity.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_type text not null
    check (product_type in (
      'course',
      'test_series',
      'spoken_english',
      'ebook',
      'subscription'
    )),
  -- Underlying entity id (e.g. courses.id). Not a FK — polymorphic by product_type.
  product_id uuid not null,
  title text not null,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'INR',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_type, product_id)
);

create index if not exists products_type_idx on public.products (product_type);
create index if not exists products_active_idx on public.products (is_active)
  where is_active = true;

comment on table public.products is
  'Sellable SKUs. payment_orders.product_id → products.id; products.product_id is the entity (course/ebook/…).';
comment on column public.products.product_id is
  'Polymorphic entity id for product_type (e.g. courses.id when type=course)';

-- Backfill one product row per existing course
insert into public.products (product_type, product_id, title, price, currency, is_active, metadata)
select
  'course',
  c.id,
  c.title,
  coalesce(c.price, 0),
  'INR',
  coalesce(c.is_published, false),
  jsonb_build_object('synced_from', 'courses')
from public.courses c
on conflict (product_type, product_id) do update
set
  title = excluded.title,
  price = excluded.price,
  is_active = excluded.is_active,
  updated_at = now();

-- payment_orders → products
alter table public.payment_orders
  add column if not exists product_id uuid references public.products (id) on delete restrict;

-- Allow non-course products (ebook, test_series, …) without a courses FK
alter table public.payment_orders
  alter column course_id drop not null;

-- Link existing course orders to their product SKU
update public.payment_orders po
set product_id = p.id
from public.products p
where po.product_id is null
  and p.product_type = 'course'
  and p.product_id = po.course_id;

create index if not exists payment_orders_product_idx
  on public.payment_orders (product_id);

comment on column public.payment_orders.product_id is
  'FK to products.id (generic SKU). course_id kept for course unlocks / legacy reads.';

-- Generic purchase ledger (any product type)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  payment_order_id uuid references public.payment_orders (id) on delete set null,
  razorpay_payment_id text,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists purchases_user_idx
  on public.purchases (user_id, purchased_at desc);

create index if not exists purchases_product_idx
  on public.purchases (product_id);

create unique index if not exists purchases_payment_id_uidx
  on public.purchases (razorpay_payment_id)
  where razorpay_payment_id is not null;

comment on table public.purchases is
  'Paid unlocks for any product type; course purchases also mirror into purchased_courses + enrollments';

alter table public.products enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "products_select_active" on public.products;
create policy "products_select_active" on public.products
  for select
  using (is_active = true);

drop policy if exists "purchases_own_select" on public.purchases;
create policy "purchases_own_select" on public.purchases
  for select
  using (auth.uid() = user_id);

-- Keep purchased_courses in sync for historical course payment_orders that already paid
insert into public.purchases (
  user_id,
  product_id,
  payment_order_id,
  razorpay_payment_id,
  amount_paise,
  currency,
  purchased_at
)
select
  pc.user_id,
  p.id,
  pc.payment_order_id,
  pc.razorpay_payment_id,
  pc.amount_paise,
  pc.currency,
  pc.purchased_at
from public.purchased_courses pc
join public.products p
  on p.product_type = 'course'
 and p.product_id = pc.course_id
on conflict (user_id, product_id) do nothing;
