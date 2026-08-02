-- Testimonials: featured approved course reviews for marketing display

alter table public.course_reviews
  add column if not exists is_testimonial boolean not null default false;

create index if not exists course_reviews_testimonial_idx
  on public.course_reviews (is_testimonial, created_at desc)
  where is_testimonial = true and status = 'approved';

comment on column public.course_reviews.is_testimonial is
  'When true and status=approved, review may be shown as a public testimonial';
