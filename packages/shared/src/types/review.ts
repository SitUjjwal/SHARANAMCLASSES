/**
 * Course rating & review domain types.
 */
export type CourseReviewStatus = 'pending_approval' | 'approved' | 'rejected';

/** Owner / admin view (includes moderation status). */
export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: CourseReviewStatus;
  author_name: string;
  rejection_reason: string | null;
  is_testimonial: boolean;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

/** Public approved review on course detail. */
export type CourseReviewPublic = {
  id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
};

/** Featured approved review for testimonials / marketing. */
export type CourseTestimonial = {
  id: string;
  course_id: string;
  course_title: string | null;
  rating: number;
  comment: string;
  author_name: string;
  student_email: string | null;
  created_at: string;
  approved_at: string | null;
};

export type CourseReviewsSummary = {
  course_id: string;
  average_rating: number;
  review_count: number;
  items: CourseReviewPublic[];
  /** Current user's review for this course (any status), when authenticated */
  my_review: CourseReview | null;
};

export type AdminCourseReview = CourseReview & {
  course_title: string | null;
  student_email: string | null;
};

export type SubmitCourseReviewInput = {
  course_id: string;
  rating: number;
  comment: string;
};

export type UpdateCourseReviewInput = {
  rating?: number;
  comment?: string;
};
