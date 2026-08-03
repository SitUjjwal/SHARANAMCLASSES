/**
 * Student feedback ticket routes — Zod on body / query / params.
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
import { requirePermission } from '../middlewares/requirePermission';
import { validate, validateRequest } from '../middlewares/validate';
import { feedbackIdParamSchema } from '../validators/common.validators';
import {
  adminFeedbackQuerySchema,
  createFeedbackSchema,
  listMyFeedbackQuerySchema,
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
feedbackRouter.get(
  '/feedback',
  requireAuth,
  validate(listMyFeedbackQuerySchema, 'query'),
  listMyFeedback,
);
feedbackRouter.get('/feedback/teachers', requireAuth, listFeedbackTeachersHandler);
feedbackRouter.get(
  '/feedback/:feedbackId',
  requireAuth,
  validate(feedbackIdParamSchema, 'params'),
  getMyFeedback,
);
feedbackRouter.patch(
  '/feedback/:feedbackId',
  requireAuth,
  validateRequest({
    params: feedbackIdParamSchema,
    body: updateFeedbackContentSchema,
  }),
  patchMyFeedback,
);
feedbackRouter.delete(
  '/feedback/:feedbackId',
  requireAuth,
  validate(feedbackIdParamSchema, 'params'),
  deleteMyFeedbackHandler,
);

feedbackRouter.get(
  '/admin/feedback',
  requireAuth,
  requirePermission('feedback:read'),
  validate(adminFeedbackQuerySchema, 'query'),
  listAdminFeedbackHandler,
);
feedbackRouter.patch(
  '/admin/feedback/:feedbackId',
  requireAuth,
  requirePermission('feedback:update'),
  validateRequest({
    params: feedbackIdParamSchema,
    body: updateFeedbackStatusSchema,
  }),
  patchAdminFeedback,
);
feedbackRouter.delete(
  '/admin/feedback/:feedbackId',
  requireAuth,
  requirePermission('feedback:delete'),
  validate(feedbackIdParamSchema, 'params'),
  deleteAdminFeedbackHandler,
);
