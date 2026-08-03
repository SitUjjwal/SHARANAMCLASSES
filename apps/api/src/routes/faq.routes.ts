/**
 * FAQ routes.
 *
 * Student:
 *   GET /faqs?q=
 *
 * Admin:
 *   GET    /admin/faqs
 *   POST   /admin/faqs
 *   PUT    /admin/faqs/reorder
 *   PATCH  /admin/faqs/:faqId
 *   DELETE /admin/faqs/:faqId
 */
import { Router } from 'express';

import {
  deleteFaqHandler,
  listAdminFaqsHandler,
  listFaqsHandler,
  patchFaq,
  postFaq,
  putReorderFaqs,
} from '../controllers/faq.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  createFaqSchema,
  listFaqsQuerySchema,
  reorderFaqsSchema,
  updateFaqSchema,
} from '../validators/faq.validators';

export const faqRouter = Router();

faqRouter.get(
  '/faqs',
  requireAuth,
  validate(listFaqsQuerySchema, 'query'),
  listFaqsHandler,
);
/** Spec alias */
faqRouter.get(
  '/faq',
  requireAuth,
  validate(listFaqsQuerySchema, 'query'),
  listFaqsHandler,
);

faqRouter.get('/admin/faqs', requireAuth, requirePermission('feedback:read'), listAdminFaqsHandler);
faqRouter.post(
  '/admin/faqs',
  requireAuth,
  requirePermission('feedback:create'),
  validate(createFaqSchema),
  postFaq,
);
/** Must be registered before /:faqId routes */
faqRouter.put(
  '/admin/faqs/reorder',
  requireAuth,
  requirePermission('feedback:update'),
  validate(reorderFaqsSchema),
  putReorderFaqs,
);
faqRouter.patch(
  '/admin/faqs/:faqId',
  requireAuth,
  requirePermission('feedback:update'),
  validate(updateFaqSchema),
  patchFaq,
);
faqRouter.delete(
  '/admin/faqs/:faqId',
  requireAuth,
  requirePermission('feedback:delete'),
  deleteFaqHandler,
);
