/**
 * myCourse.service.ts
 *
 * My Courses = courses the student owns (enrollment unlock).
 * Prefer paid purchases via purchased_courses; also include free enrollments.
 * Returns progress + last watched chapter for Continue Learning.
 */
import type { MyCourseItem, MyCoursesPage } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type {
  ListMyCoursesQuery,
  UpdateLastWatchedInput,
} from '../validators/myCourse.validators';

const COURSE_EMBED =
  'id, title, teacher_name, thumbnail_url, is_free, is_published';

type EnrollmentJoinRow = {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  last_watched_chapter_id: string | null;
  last_watched_at: string | null;
  course:
    | {
        id: string;
        title: string;
        teacher_name: string | null;
        thumbnail_url: string | null;
        is_free: boolean;
        is_published: boolean;
      }
    | {
        id: string;
        title: string;
        teacher_name: string | null;
        thumbnail_url: string | null;
        is_free: boolean;
        is_published: boolean;
      }[]
    | null;
};

function normalizeCourse(raw: EnrollmentJoinRow['course']) {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

async function loadPurchasedCourseIds(userId: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('purchased_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error) {
    // Table may not exist yet in older envs — treat as empty paid set
    if (error.message.toLowerCase().includes('purchased_courses')) {
      return new Set();
    }
    throw new AppError(500, 'PURCHASES_FETCH_FAILED', error.message);
  }

  return new Set((data ?? []).map((row) => row.course_id as string));
}

async function loadChapterTitles(
  chapterIds: string[],
): Promise<Map<string, string>> {
  if (chapterIds.length === 0) return new Map();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapters')
    .select('id, title')
    .in('id', chapterIds);

  if (error) {
    throw new AppError(500, 'CHAPTERS_FETCH_FAILED', error.message);
  }

  return new Map((data ?? []).map((row) => [row.id as string, row.title as string]));
}

/**
 * GET /my-courses — owned courses only (enrollment), with search + continue learning.
 */
export async function listMyCourses(
  userId: string,
  query: ListMyCoursesQuery,
): Promise<MyCoursesPage> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('enrollments')
    .select(
      `id, user_id, course_id, progress_percent, enrolled_at, last_watched_chapter_id, last_watched_at, course:courses(${COURSE_EMBED})`,
    )
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false, nullsFirst: false })
    .order('enrolled_at', { ascending: false });

  if (error) {
    throw new AppError(500, 'MY_COURSES_FETCH_FAILED', error.message);
  }

  const purchasedIds = await loadPurchasedCourseIds(userId);
  const rows = (data ?? []) as EnrollmentJoinRow[];

  const chapterIds = [
    ...new Set(
      rows
        .map((row) => row.last_watched_chapter_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const chapterTitles = await loadChapterTitles(chapterIds);

  const search = query.search?.trim().toLowerCase() ?? '';

  const items: MyCourseItem[] = [];
  for (const row of rows) {
    const course = normalizeCourse(row.course);
    if (!course || !course.is_published) continue;

    if (search) {
      const hay = `${course.title} ${course.teacher_name ?? ''}`.toLowerCase();
      if (!hay.includes(search)) continue;
    }

    items.push({
      enrollment_id: row.id,
      course_id: row.course_id,
      title: course.title,
      teacher_name: course.teacher_name,
      thumbnail_url: course.thumbnail_url,
      progress_percent: Math.min(100, Math.max(0, Number(row.progress_percent) || 0)),
      enrolled_at: row.enrolled_at,
      last_watched_at: row.last_watched_at,
      last_watched_chapter_id: row.last_watched_chapter_id,
      last_watched_chapter_title: row.last_watched_chapter_id
        ? chapterTitles.get(row.last_watched_chapter_id) ?? null
        : null,
      is_free: Boolean(course.is_free),
      is_purchased: purchasedIds.has(row.course_id),
    });
  }

  // Continue Learning = most recently watched owned course with a chapter
  const continueLearning =
    items.find((item) => item.last_watched_chapter_id && item.last_watched_at) ?? null;

  return { items, continue_learning: continueLearning };
}

/**
 * PATCH /my-courses/:courseId/last-watched — record chapter open for Continue Learning.
 * Also nudges progress_percent upward (cap 95 until explicit completion exists).
 */
export async function updateLastWatchedChapter(
  userId: string,
  courseId: string,
  input: UpdateLastWatchedInput,
): Promise<MyCourseItem> {
  const supabase = getSupabaseAdmin();

  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, progress_percent, course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (enrollError) {
    throw new AppError(500, 'ENROLLMENT_FETCH_FAILED', enrollError.message);
  }
  if (!enrollment) {
    throw new AppError(403, 'NOT_ENROLLED', 'You do not own this course');
  }

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, title, course_id')
    .eq('id', input.chapter_id)
    .maybeSingle();

  if (chapterError) {
    throw new AppError(500, 'CHAPTER_FETCH_FAILED', chapterError.message);
  }
  if (!chapter || chapter.course_id !== courseId) {
    throw new AppError(400, 'CHAPTER_COURSE_MISMATCH', 'Chapter does not belong to this course');
  }

  const currentProgress = Number(enrollment.progress_percent) || 0;
  const nextProgress =
    currentProgress >= 95 ? currentProgress : Math.min(95, currentProgress + 5);

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      last_watched_chapter_id: input.chapter_id,
      last_watched_at: now,
      progress_percent: nextProgress,
    })
    .eq('id', enrollment.id);

  if (updateError) {
    throw new AppError(400, 'LAST_WATCHED_UPDATE_FAILED', updateError.message);
  }

  const page = await listMyCourses(userId, { search: '' });
  const item = page.items.find((row) => row.course_id === courseId);
  if (!item) {
    throw new AppError(404, 'MY_COURSE_NOT_FOUND', 'Course not found in My Courses');
  }
  return item;
}
