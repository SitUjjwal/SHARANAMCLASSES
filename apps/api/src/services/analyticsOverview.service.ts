/**
 * Admin Analytics Dashboard overview — growth + rankings for Recharts.
 */
import type {
  AdminAnalyticsChartPoint,
  AdminAnalyticsOverview,
  AdminAnalyticsRankItem,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { getAdminPaymentStats, kolkataDayBounds } from './paymentAdmin.service';

const TZ = 'Asia/Kolkata';

function monthLabel(date: Date): string {
  return date.toLocaleString('en-IN', { month: 'short', timeZone: TZ });
}

async function countStudents(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student');
  if (error) throw new AppError(500, 'ANALYTICS_FAILED', error.message);
  return count ?? 0;
}

async function countActiveStudents(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('enrollments').select('user_id');
  if (error) return 0;
  return new Set((data ?? []).map((r) => r.user_id as string)).size;
}

async function countEnrollments(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function countLiveToday(): Promise<number> {
  const { start, end } = kolkataDayBounds();
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('live_classes')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .gte('start_time', start.toISOString())
    .lt('start_time', end.toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function buildStudentGrowth(): Promise<AdminAnalyticsChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const points: AdminAnalyticsChartPoint[] = [];
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
    if (error) throw new AppError(500, 'ANALYTICS_STUDENTS_FAILED', error.message);
    points.push({ label: monthLabel(cursor), value: count ?? 0 });
  }
  return points;
}

async function buildRevenueGrowth(): Promise<AdminAnalyticsChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const points: AdminAnalyticsChartPoint[] = [];

  for (let i = 13; i >= 0; i -= 1) {
    const now = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const { start, end } = kolkataDayBounds(now);
    const { data, error } = await supabase
      .from('payment_orders')
      .select('amount_paise')
      .eq('status', 'paid')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
    if (error) throw new AppError(500, 'ANALYTICS_REVENUE_FAILED', error.message);
    const sum = (data ?? []).reduce(
      (acc, row) => acc + Number(row.amount_paise ?? 0),
      0,
    );
    points.push({
      label: start.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: TZ,
      }),
      value: Math.round(sum / 100),
    });
  }
  return points;
}

async function buildCoursePopularity(): Promise<AdminAnalyticsRankItem[]> {
  const supabase = getSupabaseAdmin();
  const { data: enrolls, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .limit(5000);
  if (error) throw new AppError(500, 'ANALYTICS_COURSES_FAILED', error.message);

  const tallies = new Map<string, number>();
  for (const row of enrolls ?? []) {
    const id = row.course_id as string;
    tallies.set(id, (tallies.get(id) ?? 0) + 1);
  }

  const top = [...tallies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!top.length) return [];

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .in(
      'id',
      top.map(([id]) => id),
    );

  const titleById = new Map(
    (courses ?? []).map((c) => [c.id as string, (c.title as string) || 'Course']),
  );

  return top.map(([id, value]) => ({
    id,
    label: (titleById.get(id) || 'Course').slice(0, 28),
    value,
    meta: `${value} enrollments`,
  }));
}

async function buildMostViewedVideos(): Promise<AdminAnalyticsRankItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('video_watch_progress')
    .select('video_id, completed')
    .limit(8000);

  if (error) {
    if (/does not exist|video_watch_progress/i.test(error.message)) return [];
    throw new AppError(500, 'ANALYTICS_VIDEOS_FAILED', error.message);
  }

  const completions = new Map<string, number>();
  // video_watch_progress has one row per user/video typically — count rows as viewers
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.video_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (row.completed) {
      completions.set(id, (completions.get(id) ?? 0) + 1);
    }
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!top.length) return [];

  const { data: videos } = await supabase
    .from('videos')
    .select('id, title')
    .in(
      'id',
      top.map(([id]) => id),
    );
  const titleById = new Map(
    (videos ?? []).map((v) => [v.id as string, (v.title as string) || 'Video']),
  );

  return top.map(([id, value]) => ({
    id,
    label: (titleById.get(id) || 'Video').slice(0, 28),
    value,
    meta: `${completions.get(id) ?? 0} completed`,
  }));
}

async function buildMostDownloadedPdfs(): Promise<AdminAnalyticsRankItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pdf_download_events')
    .select('pdf_id')
    .limit(8000);

  if (error) {
    if (/does not exist|pdf_download/i.test(error.message)) return [];
    throw new AppError(500, 'ANALYTICS_PDFS_FAILED', error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.pdf_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!top.length) return [];

  const { data: pdfs } = await supabase
    .from('pdfs')
    .select('id, title')
    .in(
      'id',
      top.map(([id]) => id),
    );
  const titleById = new Map(
    (pdfs ?? []).map((p) => [p.id as string, (p.title as string) || 'PDF']),
  );

  return top.map(([id, value]) => ({
    id,
    label: (titleById.get(id) || 'PDF').slice(0, 28),
    value,
    meta: `${value} downloads`,
  }));
}

async function buildLiveAttendance(): Promise<AdminAnalyticsRankItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_class_attendance')
    .select('live_class_id')
    .limit(8000);

  if (error) {
    if (/does not exist|live_class_attendance/i.test(error.message)) return [];
    throw new AppError(500, 'ANALYTICS_ATTENDANCE_FAILED', error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.live_class_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!top.length) return [];

  const { data: classes } = await supabase
    .from('live_classes')
    .select('id, title, start_time')
    .in(
      'id',
      top.map(([id]) => id),
    );
  const metaById = new Map(
    (classes ?? []).map((c) => [
      c.id as string,
      {
        title: (c.title as string) || 'Live class',
        start: (c.start_time as string) || '',
      },
    ]),
  );

  return top.map(([id, value]) => {
    const meta = metaById.get(id);
    return {
      id,
      label: (meta?.title || 'Live class').slice(0, 28),
      value,
      meta: meta?.start
        ? new Date(meta.start).toLocaleDateString('en-IN', { dateStyle: 'medium' })
        : `${value} attended`,
    };
  });
}

async function buildAverageTestScores(): Promise<{
  series: AdminAnalyticsChartPoint[];
  avg: number;
  passRate: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select('percentage, is_passed, submitted_at')
    .in('status', ['submitted', 'expired'])
    .not('percentage', 'is', null)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: true })
    .limit(5000);

  if (error) throw new AppError(500, 'ANALYTICS_SCORES_FAILED', error.message);

  const rows = data ?? [];
  if (!rows.length) {
    return { series: [], avg: 0, passRate: 0 };
  }

  const byDay = new Map<string, { sum: number; n: number }>();
  let sum = 0;
  let passed = 0;
  for (const row of rows) {
    const pct = Number(row.percentage ?? 0);
    sum += pct;
    if (row.is_passed) passed += 1;
    const day = String(row.submitted_at).slice(0, 10);
    const bucket = byDay.get(day) ?? { sum: 0, n: 0 };
    bucket.sum += pct;
    bucket.n += 1;
    byDay.set(day, bucket);
  }

  const series = [...byDay.entries()]
    .slice(-14)
    .map(([day, b]) => ({
      label: new Date(day).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: TZ,
      }),
      value: Math.round((b.sum / b.n) * 10) / 10,
    }));

  return {
    series,
    avg: Math.round((sum / rows.length) * 10) / 10,
    passRate: Math.round((passed / rows.length) * 1000) / 10,
  };
}

/** GET /admin/analytics/overview */
export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  const [
    paymentStats,
    total_students,
    active_students,
    total_enrollments,
    live_classes_today,
    student_growth,
    revenue_growth,
    course_popularity,
    most_viewed_videos,
    most_downloaded_pdfs,
    live_class_attendance,
    scores,
  ] = await Promise.all([
    getAdminPaymentStats(),
    countStudents(),
    countActiveStudents(),
    countEnrollments(),
    countLiveToday(),
    buildStudentGrowth(),
    buildRevenueGrowth(),
    buildCoursePopularity(),
    buildMostViewedVideos(),
    buildMostDownloadedPdfs(),
    buildLiveAttendance(),
    buildAverageTestScores(),
  ]);

  return {
    timezone: TZ,
    kpis: {
      total_students,
      active_students,
      total_enrollments,
      monthly_revenue_display: paymentStats.monthly_revenue_display,
      avg_test_score: scores.avg,
      pass_rate: scores.passRate,
      live_classes_today,
    },
    student_growth,
    revenue_growth,
    course_popularity,
    most_viewed_videos,
    most_downloaded_pdfs,
    live_class_attendance,
    average_test_scores: scores.series,
  };
}
