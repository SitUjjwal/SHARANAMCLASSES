/**
 * Admin operations dashboard — KPI overview for home Dashboard.
 */
import type { AdminChartPoint, AdminDashboardOverview } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { getAdminPaymentStats } from './paymentAdmin.service';

const TZ = 'Asia/Kolkata';

async function countExact(
  table: string,
  filters?: Array<
    | { op: 'eq' | 'neq'; col: string; val: string | boolean }
    | { op: 'in'; col: string; val: string[] }
    | { op: 'gte' | 'lt'; col: string; val: string }
  >,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query: any = supabase.from(table).select('id', { count: 'exact', head: true });
  for (const f of filters ?? []) {
    if (f.op === 'eq') query = query.eq(f.col, f.val);
    else if (f.op === 'neq') query = query.neq(f.col, f.val);
    else if (f.op === 'in') query = query.in(f.col, f.val);
    else if (f.op === 'gte') query = query.gte(f.col, f.val);
    else query = query.lt(f.col, f.val);
  }
  const { count, error } = await query;
  if (error) {
    throw new AppError(500, 'DASHBOARD_COUNT_FAILED', error.message);
  }
  return (count as number | null) ?? 0;
}

function kolkataDayBounds(daysAgo = 0): { startIso: string; endIso: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const now = new Date();
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  const local = new Date(Date.UTC(y, m - 1, d - daysAgo));
  const start = new Date(
    `${local.toISOString().slice(0, 10)}T00:00:00+05:30`,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function monthLabel(date: Date): string {
  return date.toLocaleString('en-IN', { month: 'short', timeZone: TZ });
}

async function buildRevenueSeries(): Promise<AdminChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const points: AdminChartPoint[] = [];

  for (let i = 13; i >= 0; i -= 1) {
    const { startIso, endIso } = kolkataDayBounds(i);
    const { data, error } = await supabase
      .from('payment_orders')
      .select('amount_paise')
      .eq('status', 'paid')
      .gte('created_at', startIso)
      .lt('created_at', endIso);

    if (error) {
      throw new AppError(500, 'DASHBOARD_REVENUE_FAILED', error.message);
    }

    const sum = (data ?? []).reduce(
      (acc, row) => acc + Number(row.amount_paise ?? 0),
      0,
    );
    const day = new Date(startIso);
    points.push({
      label: day.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: TZ,
      }),
      value: Math.round(sum / 100),
    });
  }

  return points;
}

async function buildStudentSeries(): Promise<AdminChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const points: AdminChartPoint[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .gte('created_at', cursor.toISOString())
      .lt('created_at', next.toISOString());

    if (error) {
      throw new AppError(500, 'DASHBOARD_STUDENTS_FAILED', error.message);
    }

    points.push({
      label: monthLabel(cursor),
      value: count ?? 0,
    });
  }

  return points;
}

async function buildCourseSeries(): Promise<AdminChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, category_id')
    .order('title', { ascending: true })
    .limit(200);

  if (error) {
    throw new AppError(500, 'DASHBOARD_COURSES_FAILED', error.message);
  }

  const categoryIds = [
    ...new Set(
      (courses ?? [])
        .map((c) => c.category_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const nameById = new Map<string, string>();
  if (categoryIds.length) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);
    for (const c of cats ?? []) {
      nameById.set(c.id as string, (c.name as string) || 'Category');
    }
  }

  const tallies = new Map<string, number>();
  for (const course of courses ?? []) {
    const key =
      nameById.get(course.category_id as string) ||
      ((course.title as string) || 'Course').slice(0, 18);
    tallies.set(key, (tallies.get(key) ?? 0) + 1);
  }

  return [...tallies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
}

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const paymentStats = await getAdminPaymentStats();
  const today = kolkataDayBounds(0);

  const [
    total_students,
    active_students,
    total_teachers,
    total_courses,
    published_courses,
    total_tests,
    live_classes_today,
    support_tickets_open,
    feedback_pending,
    pending_reviews,
    open_bug_reports,
    total_enrollments,
    revenue_series,
    student_series,
    course_series,
  ] = await Promise.all([
    countExact('profiles', [{ op: 'eq', col: 'role', val: 'student' }]),
    // Active = students with at least one enrollment
    (async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('enrollments').select('user_id');
      if (error) {
        // Fallback: treat all students as active if enrollments table unavailable
        return countExact('profiles', [{ op: 'eq', col: 'role', val: 'student' }]);
      }
      return new Set((data ?? []).map((r) => r.user_id as string)).size;
    })(),
    countExact('profiles', [{ op: 'in', col: 'role', val: ['instructor', 'admin'] }]),
    countExact('courses'),
    countExact('courses', [{ op: 'eq', col: 'is_published', val: true }]),
    countExact('tests'),
    countExact('live_classes', [
      { op: 'eq', col: 'is_published', val: true },
      { op: 'gte', col: 'start_time', val: today.startIso },
      { op: 'lt', col: 'start_time', val: today.endIso },
    ]),
    countExact('support_conversations', [{ op: 'eq', col: 'status', val: 'open' }]),
    countExact('student_feedback', [
      { op: 'in', col: 'status', val: ['open', 'in_progress'] },
    ]),
    countExact('course_reviews', [
      { op: 'eq', col: 'status', val: 'pending_approval' },
    ]),
    countExact('bug_reports', [{ op: 'eq', col: 'status', val: 'open' }]),
    countExact('enrollments'),
    buildRevenueSeries(),
    buildStudentSeries(),
    buildCourseSeries(),
  ]);

  return {
    total_students,
    active_students,
    total_teachers,
    total_courses,
    published_courses,
    total_tests,
    live_classes_today,
    today_revenue_paise: paymentStats.today_revenue_paise,
    today_revenue_display: paymentStats.today_revenue_display,
    monthly_revenue_paise: paymentStats.monthly_revenue_paise,
    monthly_revenue_display: paymentStats.monthly_revenue_display,
    pending_payments: paymentStats.pending_payments,
    support_tickets_open,
    feedback_pending,
    pending_reviews,
    open_bug_reports,
    total_enrollments,
    revenue_series,
    student_series,
    course_series,
  };
}
