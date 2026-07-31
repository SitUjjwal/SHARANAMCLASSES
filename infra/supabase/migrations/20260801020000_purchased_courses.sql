-- Purchased courses — ledger of paid unlocks (after Razorpay signature verify).
-- Enrollments still grant app access; this table records the purchase itself.

create table if not exists public.purchased_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  payment_order_id uuid references public.payment_orders (id) on delete set null,
  razorpay_payment_id text,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists purchased_courses_user_idx
  on public.purchased_courses (user_id, purchased_at desc);

create index if not exists purchased_courses_course_idx
  on public.purchased_courses (course_id);

create unique index if not exists purchased_courses_payment_id_uidx
  on public.purchased_courses (razorpay_payment_id)
  where razorpay_payment_id is not null;

comment on table public.purchased_courses is
  'Paid course unlocks; inserted only after Razorpay signature + payment verify';

alter table public.purchased_courses enable row level security;

drop policy if exists "purchased_courses_own_select" on public.purchased_courses;
create policy "purchased_courses_own_select" on public.purchased_courses
  for select
  using (auth.uid() = user_id);
