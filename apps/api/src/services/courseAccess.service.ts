/**
 * courseAccess.service.ts
 *
 * Shared purchase/enrollment checks for content gating.
 * Full access = enrollment OR purchased_courses row.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type CourseAccessMode = 'full' | 'preview';

export type CourseAccessContext = {
  courseId: string;
  userId: string;
  /** Purchased or enrolled — unlock all media URLs */
  hasFullAccess: boolean;
  mode: CourseAccessMode;
};

export function toCourseAccessContext(
  userId: string,
  courseId: string,
  hasFullAccess: boolean,
): CourseAccessContext {
  return {
    courseId,
    userId,
    hasFullAccess,
    mode: hasFullAccess ? 'full' : 'preview',
  };
}

/** All course ids the student can fully access (enrollment ∪ purchase). */
export async function listAccessibleCourseIds(userId: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const ids = new Set<string>();

  const [{ data: enrollments, error: enrollError }, { data: purchases, error: purchaseError }] =
    await Promise.all([
      supabase.from('enrollments').select('course_id').eq('user_id', userId),
      supabase.from('purchased_courses').select('course_id').eq('user_id', userId),
    ]);

  if (enrollError) {
    throw new AppError(500, 'ENROLLMENT_FETCH_FAILED', enrollError.message);
  }
  if (purchaseError) {
    const msg = purchaseError.message.toLowerCase();
    if (!msg.includes('purchased_courses') && !msg.includes('does not exist')) {
      throw new AppError(500, 'PURCHASE_FETCH_FAILED', purchaseError.message);
    }
  }

  for (const row of enrollments ?? []) {
    if (row.course_id) ids.add(row.course_id as string);
  }
  for (const row of purchases ?? []) {
    if (row.course_id) ids.add(row.course_id as string);
  }
  return ids;
}

/** True if student may unlock all paid chapter media. */
export async function userHasCourseAccess(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const [{ data: enrollment, error: enrollError }, { data: purchase, error: purchaseError }] =
    await Promise.all([
      supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle(),
      supabase
        .from('purchased_courses')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle(),
    ]);

  if (enrollError) {
    throw new AppError(500, 'ENROLLMENT_FETCH_FAILED', enrollError.message);
  }

  // purchased_courses may be missing before migration — treat as no purchase
  if (purchaseError) {
    const msg = purchaseError.message.toLowerCase();
    if (!msg.includes('purchased_courses') && !msg.includes('does not exist')) {
      throw new AppError(500, 'PURCHASE_FETCH_FAILED', purchaseError.message);
    }
  }

  return Boolean(enrollment) || Boolean(purchase);
}

/** Ensure published course exists; return its id. */
export async function assertPublishedCourse(courseId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return data.id as string;
}

/**
 * Resolve published chapter → parent course id.
 * Rejects unpublished chapter / course.
 */
export async function resolveCourseIdFromChapter(chapterId: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('id, course_id, is_published')
    .eq('id', chapterId)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAPTER_FETCH_FAILED', error.message);
  }
  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }

  await assertPublishedCourse(chapter.course_id as string);
  return chapter.course_id as string;
}

/**
 * Build access context for a course (student content APIs).
 */
export async function buildCourseAccess(
  userId: string,
  courseId: string,
): Promise<CourseAccessContext> {
  await assertPublishedCourse(courseId);
  const hasFullAccess = await userHasCourseAccess(userId, courseId);
  return toCourseAccessContext(userId, courseId, hasFullAccess);
}

/**
 * Build access context from a chapter id (videos/pdfs/notes lists).
 */
export async function buildChapterCourseAccess(
  userId: string,
  chapterId: string,
): Promise<CourseAccessContext> {
  const courseId = await resolveCourseIdFromChapter(chapterId);
  const hasFullAccess = await userHasCourseAccess(userId, courseId);
  return toCourseAccessContext(userId, courseId, hasFullAccess);
}

/**
 * Lock rule for media items.
 * Purchased/enrolled → unlocked. Else only is_free (preview) unlocked.
 */
export function isMediaLocked(hasFullAccess: boolean, isFree: boolean): boolean {
  return !hasFullAccess && !isFree;
}
