/**
 * Learning progress — chapter-based completion across enrolled courses.
 *
 * Calculation (per course):
 *   total_chapters     = count of published chapters
 *   If last_watched_chapter_id is set:
 *     completed        = index(last_watched) + 1  (chapters up through last watched)
 *   Else (fallback from enrollment.progress_percent):
 *     completed        = round(total × progress_percent / 100)
 *   remaining          = total − completed
 *   progress_percent   = total === 0 ? 0 : round(100 × completed / total)
 *
 * Overall:
 *   overall_percentage = total_all === 0 ? 0 : round(100 × completed_all / total_all)
 */
import type { LearningProgressSummary } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

type EnrollmentRow = {
  course_id: string;
  progress_percent: number;
  last_watched_at: string | null;
  last_watched_chapter_id: string | null;
  courses:
    | { title: string; thumbnail_url: string | null }
    | { title: string; thumbnail_url: string | null }[]
    | null;
};

type ChapterRow = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
};

function normalizeCourse(raw: EnrollmentRow['courses']) {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function clampCount(n: number, max: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(max, Math.max(0, Math.round(n)));
}

export async function getLearningProgressForUser(
  userId: string,
): Promise<LearningProgressSummary> {
  const supabase = getSupabaseAdmin();

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(
      'course_id, progress_percent, last_watched_at, last_watched_chapter_id, courses(title, thumbnail_url)',
    )
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new AppError(500, 'LEARNING_PROGRESS_FAILED', error.message);
  }

  const rows = (enrollments ?? []) as EnrollmentRow[];
  if (rows.length === 0) {
    return {
      completed_chapters: 0,
      remaining_chapters: 0,
      overall_percentage: 0,
      enrolled_courses: 0,
      completed_courses: 0,
      average_progress: 0,
      continue_learning: null,
      last_watched_video: null,
      courses: [],
    };
  }

  const courseIds = rows.map((r) => r.course_id);

  const { data: chapterRows, error: chapterError } = await supabase
    .from('chapters')
    .select('id, course_id, title, sort_order')
    .in('course_id', courseIds)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (chapterError) {
    throw new AppError(500, 'LEARNING_PROGRESS_CHAPTERS_FAILED', chapterError.message);
  }

  const chaptersByCourse = new Map<string, ChapterRow[]>();
  for (const ch of (chapterRows ?? []) as ChapterRow[]) {
    const list = chaptersByCourse.get(ch.course_id) ?? [];
    list.push(ch);
    chaptersByCourse.set(ch.course_id, list);
  }

  const lastChapterIds = rows
    .map((r) => r.last_watched_chapter_id)
    .filter((id): id is string => Boolean(id));

  const videoTitleByChapter = new Map<string, string>();
  if (lastChapterIds.length > 0) {
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('chapter_id, title, sort_order')
      .in('chapter_id', lastChapterIds)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (videoError) {
      throw new AppError(500, 'LEARNING_PROGRESS_VIDEOS_FAILED', videoError.message);
    }

    for (const v of videos ?? []) {
      const chapterId = v.chapter_id as string;
      if (!videoTitleByChapter.has(chapterId)) {
        videoTitleByChapter.set(chapterId, (v.title as string) || 'Video');
      }
    }
  }

  const courses = rows.map((row) => {
    const course = normalizeCourse(row.courses);
    const chapters = chaptersByCourse.get(row.course_id) ?? [];
    const total = chapters.length;
    const storedPct = Math.min(100, Math.max(0, Number(row.progress_percent) || 0));

    let completed = 0;
    let lastChapterTitle: string | null = null;

    if (row.last_watched_chapter_id && total > 0) {
      const idx = chapters.findIndex((c) => c.id === row.last_watched_chapter_id);
      if (idx >= 0) {
        completed = idx + 1;
        lastChapterTitle = chapters[idx]?.title ?? null;
      } else {
        completed = clampCount((total * storedPct) / 100, total);
      }
    } else if (total > 0) {
      completed = clampCount((total * storedPct) / 100, total);
    }

    if (storedPct >= 100) {
      completed = total;
    }

    const remaining = Math.max(0, total - completed);
    const progress_percent =
      total === 0 ? 0 : Math.min(100, Math.round((100 * completed) / total));

    const videoTitle = row.last_watched_chapter_id
      ? videoTitleByChapter.get(row.last_watched_chapter_id) ?? null
      : null;

    return {
      course_id: row.course_id,
      title: course?.title ?? 'Course',
      thumbnail_url: course?.thumbnail_url ?? null,
      progress_percent,
      total_chapters: total,
      completed_chapters: completed,
      remaining_chapters: remaining,
      last_watched_at: row.last_watched_at,
      last_watched_chapter_id: row.last_watched_chapter_id,
      last_watched_chapter_title: lastChapterTitle,
      last_watched_video_title: videoTitle,
    };
  });

  const completed_chapters = courses.reduce((s, c) => s + c.completed_chapters, 0);
  const remaining_chapters = courses.reduce((s, c) => s + c.remaining_chapters, 0);
  const totalChapters = completed_chapters + remaining_chapters;
  const overall_percentage =
    totalChapters === 0
      ? 0
      : Math.min(100, Math.round((100 * completed_chapters) / totalChapters));

  const continueTarget = courses.find(
    (c) => c.last_watched_chapter_id && c.last_watched_at,
  );

  const continue_learning = continueTarget?.last_watched_chapter_id
    ? {
        course_id: continueTarget.course_id,
        course_title: continueTarget.title,
        chapter_id: continueTarget.last_watched_chapter_id,
        chapter_title: continueTarget.last_watched_chapter_title ?? 'Chapter',
        video_title: continueTarget.last_watched_video_title,
        last_watched_at: continueTarget.last_watched_at as string,
      }
    : null;

  const last_watched_video =
    continue_learning &&
    (continue_learning.video_title || continue_learning.chapter_title)
      ? {
          title:
            continue_learning.video_title ??
            continue_learning.chapter_title,
          course_title: continue_learning.course_title,
          chapter_title: continue_learning.chapter_title,
          course_id: continue_learning.course_id,
          chapter_id: continue_learning.chapter_id,
          watched_at: continue_learning.last_watched_at,
        }
      : null;

  return {
    completed_chapters,
    remaining_chapters,
    overall_percentage,
    enrolled_courses: courses.length,
    completed_courses: courses.filter((c) => c.progress_percent >= 100).length,
    average_progress: overall_percentage,
    continue_learning,
    last_watched_video,
    courses,
  };
}
