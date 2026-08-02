/**
 * Admin results list — all students' scored attempts.
 */
import type { TestAttemptResultSummary } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type AdminResultRow = TestAttemptResultSummary & {
  student_name: string;
  user_id: string;
};

export type AdminResultsPage = {
  items: AdminResultRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type AttemptRow = {
  id: string;
  user_id: string;
  test_id: string;
  status: 'submitted' | 'expired';
  submitted_at: string | null;
  obtained_marks: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  skipped_count: number | null;
  percentage: number | null;
  is_passed: boolean | null;
};

export async function listAdminResults(options: {
  page: number;
  pageSize: number;
}): Promise<AdminResultsPage> {
  const page = options.page;
  const pageSize = options.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, submitted_at, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
      { count: 'exact' },
    )
    .in('status', ['submitted', 'expired'])
    .not('obtained_marks', 'is', null)
    .order('submitted_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(500, 'ADMIN_RESULTS_FAILED', error.message);
  }

  const rows = (data ?? []) as AttemptRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const testIds = [...new Set(rows.map((r) => r.test_id))];

  const nameByUser = new Map<string, string>();
  const testMeta = new Map<
    string,
    { title: string; total_marks: number; passing_marks: number }
  >();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    if (profileError) {
      throw new AppError(500, 'PROFILES_FETCH_FAILED', profileError.message);
    }
    for (const p of profiles ?? []) {
      nameByUser.set(
        p.id as string,
        (typeof p.full_name === 'string' && p.full_name.trim()) || 'Student',
      );
    }
  }

  if (testIds.length > 0) {
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('id, title, total_marks, passing_marks')
      .in('id', testIds);
    if (testsError) {
      throw new AppError(500, 'TESTS_FETCH_FAILED', testsError.message);
    }
    for (const t of tests ?? []) {
      testMeta.set(t.id as string, {
        title: t.title as string,
        total_marks: Number(t.total_marks),
        passing_marks: Number(t.passing_marks),
      });
    }
  }

  const items: AdminResultRow[] = rows.map((row) => {
    const meta = testMeta.get(row.test_id);
    return {
      attempt_id: row.id,
      test_id: row.test_id,
      test_title: meta?.title ?? 'Test',
      status: row.status,
      total_marks: meta?.total_marks ?? 0,
      passing_marks: meta?.passing_marks ?? 0,
      obtained_marks: Number(row.obtained_marks ?? 0),
      correct_count: Number(row.correct_count ?? 0),
      wrong_count: Number(row.wrong_count ?? 0),
      skipped_count: Number(row.skipped_count ?? 0),
      percentage: Number(row.percentage ?? 0),
      is_passed: Boolean(row.is_passed),
      submitted_at: row.submitted_at,
      rank: null,
      student_name: nameByUser.get(row.user_id) ?? 'Student',
      user_id: row.user_id,
    };
  });

  const total = count ?? items.length;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}
