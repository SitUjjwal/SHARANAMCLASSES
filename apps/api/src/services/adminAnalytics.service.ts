/**
 * Admin platform-wide Test Series analytics (all students).
 */
import type {
  AnalyticsRecentActivity,
  AnalyticsSubjectStat,
  StudentTestAnalytics,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

type AttemptRow = {
  id: string;
  user_id: string;
  test_id: string;
  obtained_marks: number;
  percentage: number;
  is_passed: boolean | null;
  submitted_at: string;
};

type TestRow = {
  id: string;
  title: string;
  course_id: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  subject: string | null;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function subjectLabel(course: CourseRow | undefined): string {
  if (!course) return 'General';
  const subject = course.subject?.trim();
  if (subject) return subject;
  const title = course.title?.trim();
  if (title) return title;
  return 'General';
}

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

export async function getAdminTestAnalytics(): Promise<StudentTestAnalytics> {
  const supabase = getSupabaseAdmin();

  const { data: attemptsRaw, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, obtained_marks, percentage, is_passed, submitted_at',
    )
    .in('status', ['submitted', 'expired'])
    .not('obtained_marks', 'is', null)
    .not('percentage', 'is', null)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(5000);

  if (error) {
    throw new AppError(500, 'ADMIN_ANALYTICS_FAILED', error.message);
  }

  const attempts = (attemptsRaw ?? []) as AttemptRow[];
  if (attempts.length === 0) {
    return {
      summary: {
        average_score: 0,
        total_tests: 0,
        total_attempts: 0,
        pass_percentage: 0,
      },
      strong_subjects: [],
      weak_subjects: [],
      recent_activity: [],
      charts: { score_over_time: [], by_subject: [] },
    };
  }

  const testIds = [...new Set(attempts.map((a) => a.test_id))];
  const { data: testsRaw, error: testsError } = await supabase
    .from('tests')
    .select('id, title, course_id')
    .in('id', testIds);
  if (testsError) {
    throw new AppError(500, 'ADMIN_ANALYTICS_FAILED', testsError.message);
  }

  const tests = (testsRaw ?? []) as TestRow[];
  const testById = new Map(tests.map((t) => [t.id, t]));
  const courseIds = [
    ...new Set(
      tests.map((t) => t.course_id).filter((id): id is string => Boolean(id)),
    ),
  ];

  const courseById = new Map<string, CourseRow>();
  if (courseIds.length > 0) {
    const { data: coursesRaw, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, subject')
      .in('id', courseIds);
    if (coursesError) {
      throw new AppError(500, 'ADMIN_ANALYTICS_FAILED', coursesError.message);
    }
    for (const c of (coursesRaw ?? []) as CourseRow[]) {
      courseById.set(c.id, c);
    }
  }

  const totalAttempts = attempts.length;
  const totalTests = new Set(attempts.map((a) => a.test_id)).size;
  const avgScore =
    attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / totalAttempts;
  const passed = attempts.filter((a) => Boolean(a.is_passed)).length;

  const bySubject = new Map<
    string,
    { sumPct: number; attempts: number; passed: number }
  >();

  for (const attempt of attempts) {
    const test = testById.get(attempt.test_id);
    const course = test?.course_id
      ? courseById.get(test.course_id)
      : undefined;
    const subject = subjectLabel(course);
    const bucket = bySubject.get(subject) ?? {
      sumPct: 0,
      attempts: 0,
      passed: 0,
    };
    bucket.sumPct += Number(attempt.percentage);
    bucket.attempts += 1;
    if (attempt.is_passed) bucket.passed += 1;
    bySubject.set(subject, bucket);
  }

  const subjectStats: AnalyticsSubjectStat[] = Array.from(bySubject.entries())
    .map(([subject, b]) => ({
      subject,
      average_percentage: round1(b.sumPct / b.attempts),
      attempts: b.attempts,
      pass_percent: round1((b.passed / b.attempts) * 100),
    }))
    .sort((a, b) => b.average_percentage - a.average_percentage);

  const recent_activity: AnalyticsRecentActivity[] = attempts
    .slice(0, 20)
    .map((a) => {
      const test = testById.get(a.test_id);
      const course = test?.course_id
        ? courseById.get(test.course_id)
        : undefined;
      return {
        attempt_id: a.id,
        test_id: a.test_id,
        test_title: test?.title ?? 'Test',
        subject: subjectLabel(course),
        percentage: Number(a.percentage),
        obtained_marks: Number(a.obtained_marks),
        is_passed: Boolean(a.is_passed),
        submitted_at: a.submitted_at,
      };
    });

  const byDay = new Map<string, { sum: number; n: number }>();
  for (const a of attempts) {
    const day = toDay(a.submitted_at);
    const bucket = byDay.get(day) ?? { sum: 0, n: 0 };
    bucket.sum += Number(a.percentage);
    bucket.n += 1;
    byDay.set(day, bucket);
  }

  return {
    summary: {
      average_score: round1(avgScore),
      total_tests: totalTests,
      total_attempts: totalAttempts,
      pass_percentage: round1((passed / totalAttempts) * 100),
    },
    strong_subjects: subjectStats.slice(0, 5),
    weak_subjects: [...subjectStats]
      .sort((a, b) => a.average_percentage - b.average_percentage)
      .slice(0, 5),
    recent_activity,
    charts: {
      score_over_time: Array.from(byDay.entries())
        .map(([date, b]) => ({
          date,
          average_percentage: round1(b.sum / b.n),
          attempts: b.n,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14),
      by_subject: subjectStats,
    },
  };
}
