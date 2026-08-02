/**
 * Course rating & review service.
 * One review per user/course; admin approval before public display;
 * courses.rating + review_count recalculated from approved rows.
 */
import type {
  AdminCourseReview,
  CourseReview,
  CourseReviewPublic,
  CourseReviewStatus,
  CourseReviewsSummary,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const REVIEW_COLUMNS =
  'id, course_id, user_id, rating, comment, status, rejection_reason, is_testimonial, approved_at, approved_by, created_at, updated_at';

type ReviewRow = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: string;
  rejection_reason: string | null;
  is_testimonial: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

function toReview(row: ReviewRow, authorName: string): CourseReview {
  return {
    id: row.id,
    course_id: row.course_id,
    user_id: row.user_id,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    status: row.status as CourseReviewStatus,
    author_name: authorName,
    rejection_reason: row.rejection_reason,
    is_testimonial: Boolean(row.is_testimonial),
    created_at: row.created_at,
    updated_at: row.updated_at,
    approved_at: row.approved_at,
  };
}

function toPublic(row: ReviewRow, authorName: string): CourseReviewPublic {
  return {
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    author_name: authorName,
    created_at: row.created_at,
  };
}

async function loadAuthorNames(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', unique);

  for (const p of data ?? []) {
    const name = ((p.full_name as string) ?? '').trim();
    map.set(p.id as string, name || 'Student');
  }
  return map;
}

async function assertCourseExists(courseId: string): Promise<void> {
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
}

async function assertEnrolled(userId: string, courseId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ENROLLMENT_CHECK_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(
      403,
      'NOT_ENROLLED',
      'Enroll in this course before leaving a review',
    );
  }
}

/**
 * Recalculate denormalized average + count from approved reviews.
 */
export async function recalculateCourseRating(courseId: string): Promise<{
  average_rating: number;
  review_count: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('course_reviews')
    .select('rating')
    .eq('course_id', courseId)
    .eq('status', 'approved');

  if (error) {
    throw new AppError(500, 'REVIEW_AGGREGATE_FAILED', error.message);
  }

  const ratings = (data ?? []).map((r) => Number(r.rating));
  const review_count = ratings.length;
  const average_rating =
    review_count === 0
      ? 0
      : Math.round((ratings.reduce((a, b) => a + b, 0) / review_count) * 10) / 10;

  const { error: updateError } = await supabase
    .from('courses')
    .update({ rating: average_rating, review_count })
    .eq('id', courseId);

  if (updateError) {
    // Older DBs may lack review_count — try rating only
    if (updateError.message.toLowerCase().includes('review_count')) {
      const { error: fallback } = await supabase
        .from('courses')
        .update({ rating: average_rating })
        .eq('id', courseId);
      if (fallback) {
        throw new AppError(500, 'COURSE_RATING_UPDATE_FAILED', fallback.message);
      }
    } else {
      throw new AppError(500, 'COURSE_RATING_UPDATE_FAILED', updateError.message);
    }
  }

  return { average_rating, review_count };
}

export async function getCourseReviewsSummary(
  courseId: string,
  userId?: string,
): Promise<CourseReviewsSummary> {
  await assertCourseExists(courseId);
  const supabase = getSupabaseAdmin();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('rating, review_count')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', courseError.message);
  }

  const { data: rows, error } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('course_id', courseId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', error.message);
  }

  const reviewRows = (rows ?? []) as ReviewRow[];
  let myRow: ReviewRow | null = null;

  if (userId) {
    const { data: mine, error: mineError } = await supabase
      .from('course_reviews')
      .select(REVIEW_COLUMNS)
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();
    if (mineError) {
      throw new AppError(500, 'REVIEWS_FETCH_FAILED', mineError.message);
    }
    myRow = (mine as ReviewRow | null) ?? null;
  }

  const authorIds = [
    ...reviewRows.map((r) => r.user_id),
    ...(myRow ? [myRow.user_id] : []),
  ];
  const names = await loadAuthorNames(authorIds);

  const review_count = Math.max(0, Number(course?.review_count) || reviewRows.length);
  const average_rating = Math.min(
    5,
    Math.max(0, Number(course?.rating) || 0),
  );

  return {
    course_id: courseId,
    average_rating,
    review_count,
    items: reviewRows.map((r) =>
      toPublic(r, names.get(r.user_id) ?? 'Student'),
    ),
    my_review: myRow
      ? toReview(myRow, names.get(myRow.user_id) ?? 'Student')
      : null,
  };
}

export async function getMyReviewForCourse(
  userId: string,
  courseId: string,
): Promise<CourseReview | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', error.message);
  }
  if (!data) return null;

  const names = await loadAuthorNames([userId]);
  return toReview(data as ReviewRow, names.get(userId) ?? 'Student');
}

export async function createCourseReview(
  userId: string,
  input: { course_id: string; rating: number; comment: string },
): Promise<CourseReview> {
  await assertCourseExists(input.course_id);
  await assertEnrolled(userId, input.course_id);

  const existing = await getMyReviewForCourse(userId, input.course_id);
  if (existing) {
    throw new AppError(
      409,
      'REVIEW_EXISTS',
      'You already reviewed this course. Edit or delete your existing review.',
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('course_reviews')
    .insert({
      course_id: input.course_id,
      user_id: userId,
      rating: input.rating,
      comment: input.comment.trim(),
      status: 'pending_approval',
      created_at: now,
      updated_at: now,
    })
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        409,
        'REVIEW_EXISTS',
        'You already reviewed this course. Edit or delete your existing review.',
      );
    }
    throw new AppError(500, 'REVIEW_CREATE_FAILED', error.message);
  }

  const names = await loadAuthorNames([userId]);
  return toReview(data as ReviewRow, names.get(userId) ?? 'Student');
}

export async function updateCourseReview(
  userId: string,
  reviewId: string,
  input: { rating?: number; comment?: string },
): Promise<CourseReview> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  }
  if ((current as ReviewRow).user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only edit your own review');
  }

  const row = current as ReviewRow;
  const wasApproved = row.status === 'approved';
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    // Edits require re-approval before public display
    status: 'pending_approval',
    approved_at: null,
    approved_by: null,
    rejection_reason: null,
  };
  if (input.rating !== undefined) patch.rating = input.rating;
  if (input.comment !== undefined) patch.comment = input.comment.trim();

  const { data, error } = await supabase
    .from('course_reviews')
    .update(patch)
    .eq('id', reviewId)
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'REVIEW_UPDATE_FAILED', error.message);
  }

  if (wasApproved) {
    await recalculateCourseRating(row.course_id);
  }

  const names = await loadAuthorNames([userId]);
  return toReview(data as ReviewRow, names.get(userId) ?? 'Student');
}

export async function deleteCourseReview(
  userId: string,
  reviewId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  }
  const row = current as ReviewRow;
  if (row.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only delete your own review');
  }

  const wasApproved = row.status === 'approved';
  const { error } = await supabase.from('course_reviews').delete().eq('id', reviewId);
  if (error) {
    throw new AppError(500, 'REVIEW_DELETE_FAILED', error.message);
  }

  if (wasApproved) {
    await recalculateCourseRating(row.course_id);
  }
}

export async function listAdminReviews(filters?: {
  status?: CourseReviewStatus;
  course_id?: string;
}): Promise<AdminCourseReview[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.course_id) {
    query = query.eq('course_id', filters.course_id);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as ReviewRow[];
  const userIds = rows.map((r) => r.user_id);
  const courseIds = [...new Set(rows.map((r) => r.course_id))];
  const names = await loadAuthorNames(userIds);

  const courseTitle = new Map<string, string>();
  const emailByUser = new Map<string, string>();

  if (courseIds.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      courseTitle.set(c.id as string, (c.title as string) ?? '');
    }
  }

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', [...new Set(userIds)]);
    for (const p of profiles ?? []) {
      emailByUser.set(p.id as string, (p.email as string) ?? '');
      const n = ((p.full_name as string) ?? '').trim();
      if (n) names.set(p.id as string, n);
    }
  }

  return rows.map((r) => ({
    ...toReview(r, names.get(r.user_id) ?? 'Student'),
    course_title: courseTitle.get(r.course_id) ?? null,
    student_email: emailByUser.get(r.user_id) ?? null,
  }));
}

export async function approveCourseReview(
  reviewId: string,
  adminUserId: string,
): Promise<CourseReview> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  }

  const row = current as ReviewRow;
  if (row.status === 'approved') {
    const names = await loadAuthorNames([row.user_id]);
    return toReview(row, names.get(row.user_id) ?? 'Student');
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('course_reviews')
    .update({
      status: 'approved',
      approved_at: now,
      approved_by: adminUserId,
      rejection_reason: null,
      updated_at: now,
    })
    .eq('id', reviewId)
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'REVIEW_APPROVE_FAILED', error.message);
  }

  await recalculateCourseRating(row.course_id);

  const names = await loadAuthorNames([row.user_id]);
  return toReview(data as ReviewRow, names.get(row.user_id) ?? 'Student');
}

export async function rejectCourseReview(
  reviewId: string,
  reason?: string,
): Promise<CourseReview> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  }

  const row = current as ReviewRow;
  const wasApproved = row.status === 'approved';
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('course_reviews')
    .update({
      status: 'rejected',
      rejection_reason: reason?.trim() || null,
      approved_at: null,
      approved_by: null,
      is_testimonial: false,
      updated_at: now,
    })
    .eq('id', reviewId)
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'REVIEW_REJECT_FAILED', error.message);
  }

  if (wasApproved) {
    await recalculateCourseRating(row.course_id);
  }

  const names = await loadAuthorNames([row.user_id]);
  return toReview(data as ReviewRow, names.get(row.user_id) ?? 'Student');
}

export async function listAdminTestimonials(): Promise<AdminCourseReview[]> {
  const rows = await listAdminReviews({ status: 'approved' });
  return rows.filter((r) => r.is_testimonial);
}

export async function setReviewTestimonial(
  reviewId: string,
  isTestimonial: boolean,
): Promise<CourseReview> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('course_reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  }

  const row = current as ReviewRow;
  if (isTestimonial && row.status !== 'approved') {
    throw new AppError(
      400,
      'REVIEW_NOT_APPROVED',
      'Only approved reviews can be featured as testimonials',
    );
  }

  const { data, error } = await supabase
    .from('course_reviews')
    .update({
      is_testimonial: isTestimonial,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'TESTIMONIAL_UPDATE_FAILED', error.message);
  }

  const names = await loadAuthorNames([row.user_id]);
  return toReview(data as ReviewRow, names.get(row.user_id) ?? 'Student');
}
