-- Index for leaderboard queries (scored attempts by submit time / score).

create index if not exists test_attempts_leaderboard_idx
  on public.test_attempts (status, submitted_at desc, percentage desc)
  where obtained_marks is not null
    and status in ('submitted', 'expired');

create index if not exists test_attempts_test_score_idx
  on public.test_attempts (test_id, percentage desc, obtained_marks desc)
  where obtained_marks is not null
    and status in ('submitted', 'expired');
