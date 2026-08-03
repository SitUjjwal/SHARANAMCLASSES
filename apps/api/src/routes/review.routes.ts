/**
 * Course review routes.
 *
 * Student (canonical + aliases):
 *   POST   /reviews
 *   GET    /reviews/:courseId          (alias of /courses/:courseId/reviews)
 *   GET    /courses/:courseId/reviews
 *   GET    /reviews/mine?course_id=
 *   PUT    /reviews/:id                (alias of PATCH)
 *   PATCH  /reviews/:reviewId
 *   DELETE /reviews/:id | /reviews/:reviewId
 *
 * Admin:
 *   GET  /admin/reviews?status=&course_id=
 *   POST /admin/reviews/:reviewId/approve
 *   POST /admin/reviews/:reviewId/reject
 */
import { Router } from 'express';

import {
  deleteReviewHandler,
  getMyReview,
  listAdminReviewsHandler,
  listAdminTestimonialsHandler,
  listCourseReviews,
  patchReview,
  patchReviewTestimonial,
  postApproveReview,
  postCreateReview,
  postRejectReview,
} from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  adminReviewsQuerySchema,
  createReviewSchema,
  mineReviewQuerySchema,
  rejectReviewSchema,
  updateReviewSchema,
} from '../validators/review.validators';

export const reviewRouter = Router();

reviewRouter.get('/courses/:courseId/reviews', requireAuth, listCourseReviews);
reviewRouter.get(
  '/reviews/mine',
  requireAuth,
  validate(mineReviewQuerySchema, 'query'),
  getMyReview,
);
reviewRouter.post('/reviews', requireAuth, validate(createReviewSchema), postCreateReview);
reviewRouter.patch(
  '/reviews/:reviewId',
  requireAuth,
  validate(updateReviewSchema),
  patchReview,
);
reviewRouter.put(
  '/reviews/:id',
  requireAuth,
  validate(updateReviewSchema),
  patchReview,
);
reviewRouter.delete('/reviews/:reviewId', requireAuth, deleteReviewHandler);
reviewRouter.delete('/reviews/:id', requireAuth, deleteReviewHandler);

/** Spec alias: GET /reviews/:courseId — keep after /reviews/mine */
reviewRouter.get('/reviews/:courseId', requireAuth, listCourseReviews);

reviewRouter.get(
  '/admin/reviews',
  requireAuth,
  requirePermission('feedback:read'),
  validate(adminReviewsQuerySchema, 'query'),
  listAdminReviewsHandler,
);
reviewRouter.post(
  '/admin/reviews/:reviewId/approve',
  requireAuth,
  requirePermission('feedback:create'),
  postApproveReview,
);
reviewRouter.post(
  '/admin/reviews/:reviewId/reject',
  requireAuth,
  requirePermission('feedback:create'),
  validate(rejectReviewSchema),
  postRejectReview,
);
reviewRouter.patch(
  '/admin/reviews/:reviewId/testimonial',
  requireAuth,
  requirePermission('feedback:update'),
  patchReviewTestimonial,
);
reviewRouter.get(
  '/admin/testimonials',
  requireAuth,
  requirePermission('feedback:read'),
  listAdminTestimonialsHandler,
);
