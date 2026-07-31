-- Razorpay payment orders — server is source of truth for amount + status.
-- Never trust client-reported payment success without signature + API verify.

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'expired')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  receipt text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_user_idx
  on public.payment_orders (user_id, created_at desc);

create index if not exists payment_orders_course_idx
  on public.payment_orders (course_id);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

create unique index if not exists payment_orders_payment_id_uidx
  on public.payment_orders (razorpay_payment_id)
  where razorpay_payment_id is not null;

comment on table public.payment_orders is
  'Razorpay orders; amount always set server-side from courses.price';

alter table public.payment_orders enable row level security;

-- Students may read their own orders (API uses service role for writes)
drop policy if exists "payment_orders_own_select" on public.payment_orders;
create policy "payment_orders_own_select" on public.payment_orders
  for select
  using (auth.uid() = user_id);
