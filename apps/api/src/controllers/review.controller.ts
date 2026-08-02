/**
 * Course review HTTP handlers — student CRUD + admin approve/reject.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  approveCourseReview,
  createCourseReview,
  deleteCourseReview,
  getCourseReviewsSummary,
  getMyReviewForCourse,
  listAdminReviews,
  listAdminTestimonials,
  rejectCourseReview,
  setReviewTestimonial,
  updateCourseReview,
} from '../services/review.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from '../validators/review.validators';
import type { CourseReviewStatus } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** GET /courses/:courseId/reviews */
export async function listCourseReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = requireParam(req.params.courseId, 'courseId');
    const userId = req.user?.id;
    const data = await getCourseReviewsSummary(courseId, userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /reviews/mine?course_id= */
export async function getMyReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = String(
      (req.query as { course_id?: string }).course_id ?? '',
    );
    const data = await getMyReviewForCourse(userId, courseId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /reviews */
export async function postCreateReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as CreateReviewInput;
    const data = await createCourseReview(userId, body);
    res.status(201).json({
      success: true,
      data,
      message: 'Review submitted for admin approval',
    });
  } catch (error) {
    next(error);
  }
}

/** PATCH|PUT /reviews/:reviewId (also accepts :id) */
export async function patchReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const reviewId = requireParam(
      req.params.reviewId ?? req.params.id,
      'reviewId',
    );
    const body = req.body as UpdateReviewInput;
    const data = await updateCourseReview(userId, reviewId, body);
    res.status(200).json({
      success: true,
      data,
      message: 'Review updated and pending approval',
    });
  } catch (error) {
    next(error);
  }
}

/** DELETE /reviews/:reviewId (also accepts :id) */
export async function deleteReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const reviewId = requireParam(
      req.params.reviewId ?? req.params.id,
      'reviewId',
    );
    await deleteCourseReview(userId, reviewId);
    res.status(200).json({ success: true, data: null, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/reviews */
export async function listAdminReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as {
      status?: CourseReviewStatus;
      course_id?: string;
    };
    const data = await listAdminReviews({
      status: q.status,
      course_id: q.course_id,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/reviews/:reviewId/approve */
export async function postApproveReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const reviewId = requireParam(req.params.reviewId, 'reviewId');
    const data = await approveCourseReview(reviewId, adminId);
    res.status(200).json({ success: true, data, message: 'Review approved' });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/reviews/:reviewId/reject */
export async function postRejectReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const reviewId = requireParam(req.params.reviewId, 'reviewId');
    const reason = (req.body as { reason?: string })?.reason;
    const data = await rejectCourseReview(reviewId, reason);
    res.status(200).json({ success: true, data, message: 'Review rejected' });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/testimonials */
export async function listAdminTestimonialsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const data = await listAdminTestimonials();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/reviews/:reviewId/testimonial */
export async function patchReviewTestimonial(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const reviewId = requireParam(req.params.reviewId, 'reviewId');
    const isTestimonial = Boolean(
      (req.body as { is_testimonial?: boolean })?.is_testimonial,
    );
    const data = await setReviewTestimonial(reviewId, isTestimonial);
    res.status(200).json({
      success: true,
      data,
      message: isTestimonial ? 'Added to testimonials' : 'Removed from testimonials',
    });
  } catch (error) {
    next(error);
  }
}
