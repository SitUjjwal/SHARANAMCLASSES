/**
 * Student feedback ticket routes.
 *
 * Student:
 *   POST   /feedback
 *   GET    /feedback
 *   GET    /feedback/teachers
 *   GET    /feedback/:feedbackId
 *   PATCH  /feedback/:feedbackId   (open only — title/message)
 *   DELETE /feedback/:feedbackId   (open only)
 *
 * Admin:
 *   GET    /admin/feedback?status=&feedback_type=
 *   PATCH  /admin/feedback/:feedbackId
 *   DELETE /admin/feedback/:feedbackId
 */
import { Router } from 'express';

import {
  deleteAdminFeedbackHandler,
  deleteMyFeedbackHandler,
  getMyFeedback,
  listAdminFeedbackHandler,
  listFeedbackTeachersHandler,
  listMyFeedback,
  patchAdminFeedback,
  patchMyFeedback,
  postCreateFeedback,
} from '../controllers/feedback.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  adminFeedbackQuerySchema,
  createFeedbackSchema,
  updateFeedbackContentSchema,
  updateFeedbackStatusSchema,
} from '../validators/feedback.validators';

export const feedbackRouter = Router();

feedbackRouter.post(
  '/feedback',
  requireAuth,
  validate(createFeedbackSchema),
  postCreateFeedback,
);
feedbackRouter.get('/feedback', requireAuth, listMyFeedback);
feedbackRouter.get('/feedback/teachers', requireAuth, listFeedbackTeachersHandler);
feedbackRouter.get('/feedback/:feedbackId', requireAuth, getMyFeedback);
feedbackRouter.patch(
  '/feedback/:feedbackId',
  requireAuth,
  validate(updateFeedbackContentSchema),
  patchMyFeedback,
);
feedbackRouter.delete('/feedback/:feedbackId', requireAuth, deleteMyFeedbackHandler);

feedbackRouter.get(
  '/admin/feedback',
  requireAuth,
  requireAdmin,
  validate(adminFeedbackQuerySchema, 'query'),
  listAdminFeedbackHandler,
);
feedbackRouter.patch(
  '/admin/feedback/:feedbackId',
  requireAuth,
  requireAdmin,
  validate(updateFeedbackStatusSchema),
  patchAdminFeedback,
);
feedbackRouter.delete(
  '/admin/feedback/:feedbackId',
  requireAuth,
  requireAdmin,
  deleteAdminFeedbackHandler,
);
