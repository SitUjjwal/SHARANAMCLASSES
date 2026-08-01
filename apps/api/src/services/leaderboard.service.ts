/**
 * leaderboard.service.ts — Top 100 scored test attempts.
 *
 * Ranking: best attempt per student within filters
 *   1) percentage DESC
 *   2) obtained_marks DESC
 *   3) time_taken ASC (faster wins ties)
 *
 * Filters: courseId → tests.course_id, testId, date (submitted_at day UTC).
 */
import type { LeaderboardEntry, LeaderboardPage } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { LeaderboardQuery } from '../validators/leaderboard.validators';

type AttemptScoreRow = {
  id: string;
  user_id: string;
  test_id: string;
  started_at: string;
  submitted_at: string;
  obtained_marks: number;
  percentage: number;
};

type TestMeta = {
  id: string;
  title: string;
  course_id: string | null;
};

function dayBoundsUtc(dateYmd: string): { from: string; to: string } {
  const from = new Date(`${dateYmd}T00:00:00.000Z`);
  const to = new Date(`${dateYmd}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AppError(400, 'INVALID_DATE', 'date must be YYYY-MM-DD');
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function timeTakenSeconds(startedAt: string, submittedAt: string): number {
  const ms = Date.parse(submittedAt) - Date.parse(startedAt);
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.round(ms / 1000);
}

function betterAttempt(a: AttemptScoreRow, b: AttemptScoreRow): AttemptScoreRow {
  const pa = Number(a.percentage);
  const pb = Number(b.percentage);
  if (pa !== pb) return pa > pb ? a : b;

  const sa = Number(a.obtained_marks);
  const sb = Number(b.obtained_marks);
  if (sa !== sb) return sa > sb ? a : b;

  const ta = timeTakenSeconds(a.started_at, a.submitted_at);
  const tb = timeTakenSeconds(b.started_at, b.submitted_at);
  return ta <= tb ? a : b;
}

async function resolveTestIdsForCourse(courseId: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tests')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true);

  if (error) {
    throw new AppError(500, 'TESTS_FETCH_FAILED', error.message);
  }
  return (data ?? []).map((row) => row.id as string);
}

export async function getLeaderboard(
  query: LeaderboardQuery,
): Promise<LeaderboardPage> {
  const limit = query.limit ?? 100;
  const supabase = getSupabaseAdmin();

  let testIdsFilter: string[] | null = null;

  if (query.testId) {
    testIdsFilter = [query.testId];
  } else if (query.courseId) {
    testIdsFilter = await resolveTestIdsForCourse(query.courseId);
    if (testIdsFilter.length === 0) {
      return {
        items: [],
        total: 0,
        limit,
        filters: {
          courseId: query.courseId ?? null,
          testId: query.testId ?? null,
          date: query.date ?? null,
        },
      };
    }
  }

  let q = supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, started_at, submitted_at, obtained_marks, percentage',
    )
    .in('status', ['submitted', 'expired'])
    .not('obtained_marks', 'is', null)
    .not('submitted_at', 'is', null)
    .not('percentage', 'is', null)
    .order('percentage', { ascending: false })
    .limit(2000);

  if (testIdsFilter) {
    q = q.in('test_id', testIdsFilter);
  }

  if (query.date) {
    const { from, to } = dayBoundsUtc(query.date);
    q = q.gte('submitted_at', from).lte('submitted_at', to);
  }

  const { data, error } = await q;
  if (error) {
    throw new AppError(500, 'LEADERBOARD_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as AttemptScoreRow[];

  // Best attempt per student
  const bestByUser = new Map<string, AttemptScoreRow>();
  for (const row of rows) {
    const existing = bestByUser.get(row.user_id);
    if (!existing) {
      bestByUser.set(row.user_id, row);
    } else {
      bestByUser.set(row.user_id, betterAttempt(existing, row));
    }
  }

  const best = Array.from(bestByUser.values()).sort((a, b) => {
    const pa = Number(a.percentage);
    const pb = Number(b.percentage);
    if (pb !== pa) return pb - pa;
    const sa = Number(a.obtained_marks);
    const sb = Number(b.obtained_marks);
    if (sb !== sa) return sb - sa;
    return (
      timeTakenSeconds(a.started_at, a.submitted_at) -
      timeTakenSeconds(b.started_at, b.submitted_at)
    );
  });

  const top = best.slice(0, limit);
  const userIds = [...new Set(top.map((r) => r.user_id))];
  const testIds = [...new Set(top.map((r) => r.test_id))];

  const nameByUser = new Map<string, string>();
  const testById = new Map<string, TestMeta>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    if (profileError) {
      throw new AppError(500, 'PROFILES_FETCH_FAILED', profileError.message);
    }
    for (const p of profiles ?? []) {
      const name =
        typeof p.full_name === 'string' && p.full_name.trim()
          ? p.full_name.trim()
          : 'Student';
      nameByUser.set(p.id as string, name);
    }
  }

  if (testIds.length > 0) {
    const { data: tests, error: testError } = await supabase
      .from('tests')
      .select('id, title, course_id')
      .in('id', testIds);
    if (testError) {
      throw new AppError(500, 'TESTS_FETCH_FAILED', testError.message);
    }
    for (const t of tests ?? []) {
      testById.set(t.id as string, {
        id: t.id as string,
        title: t.title as string,
        course_id: (t.course_id as string | null) ?? null,
      });
    }
  }

  const items: LeaderboardEntry[] = top.map((row, index) => {
    const test = testById.get(row.test_id);
    return {
      rank: index + 1,
      user_id: row.user_id,
      student_name: nameByUser.get(row.user_id) ?? 'Student',
      score: Number(row.obtained_marks),
      percentage: Number(row.percentage),
      time_taken_seconds: timeTakenSeconds(row.started_at, row.submitted_at),
      attempt_id: row.id,
      test_id: row.test_id,
      test_title: test?.title ?? 'Test',
      course_id: test?.course_id ?? null,
      submitted_at: row.submitted_at,
    };
  });

  return {
    items,
    total: items.length,
    limit,
    filters: {
      courseId: query.courseId ?? null,
      testId: query.testId ?? null,
      date: query.date ?? null,
    },
  };
}
