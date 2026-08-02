/**
 * Admin course reviews API.
 */
import type { AdminCourseReview, CourseReview, CourseReviewStatus } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function listAdminReviews(params?: {
  status?: CourseReviewStatus;
  course_id?: string;
}): Promise<AdminCourseReview[]> {
  return apiRequest<AdminCourseReview[]>('/admin/reviews', {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.course_id ? { course_id: params.course_id } : {}),
    },
  });
}

export async function approveReview(reviewId: string): Promise<CourseReview> {
  return apiRequest<CourseReview>(`/admin/reviews/${reviewId}/approve`, {
    method: 'POST',
  });
}

export async function rejectReview(
  reviewId: string,
  reason?: string,
): Promise<CourseReview> {
  return apiRequest<CourseReview>(`/admin/reviews/${reviewId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

export async function listAdminTestimonials(): Promise<AdminCourseReview[]> {
  return apiRequest<AdminCourseReview[]>('/admin/testimonials');
}

export async function setReviewTestimonial(
  reviewId: string,
  is_testimonial: boolean,
): Promise<CourseReview> {
  return apiRequest<CourseReview>(`/admin/reviews/${reviewId}/testimonial`, {
    method: 'PATCH',
    body: { is_testimonial },
  });
}
