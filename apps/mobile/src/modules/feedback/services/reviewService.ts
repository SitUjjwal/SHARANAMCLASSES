/**
 * reviewService — course rating & review API.
 */
import type {
  ApiSuccessResponse,
  CourseReview,
  CourseReviewsSummary,
  SubmitCourseReviewInput,
  UpdateCourseReviewInput,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchCourseReviews(
  courseId: string,
): Promise<CourseReviewsSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseReviewsSummary>>(
    `/courses/${courseId}/reviews`,
  );
  return data.data;
}

export async function fetchMyReview(
  courseId: string,
): Promise<CourseReview | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseReview | null>>(
    '/reviews/mine',
    { params: { course_id: courseId } },
  );
  return data.data;
}

export async function submitReview(
  input: SubmitCourseReviewInput,
): Promise<CourseReview> {
  const { data } = await apiClient.post<ApiSuccessResponse<CourseReview>>(
    '/reviews',
    input,
  );
  return data.data;
}

export async function updateReview(
  reviewId: string,
  input: UpdateCourseReviewInput,
): Promise<CourseReview> {
  const { data } = await apiClient.patch<ApiSuccessResponse<CourseReview>>(
    `/reviews/${reviewId}`,
    input,
  );
  return data.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(`/reviews/${reviewId}`);
}

/** @deprecated Prefer fetchCourseReviews — kept for older call sites */
export async function fetchReviews(courseId?: string) {
  if (!courseId) return [];
  const summary = await fetchCourseReviews(courseId);
  return summary.items.map((item) => ({
    id: item.id,
    author_name: item.author_name,
    rating: item.rating,
    comment: item.comment,
    created_at: item.created_at,
  }));
}
