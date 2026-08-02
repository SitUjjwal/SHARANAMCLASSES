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
import { requireAdmin } from '../middlewares/requireAdmin';
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

faqRouter.get('/admin/faqs', requireAuth, requireAdmin, listAdminFaqsHandler);
faqRouter.post(
  '/admin/faqs',
  requireAuth,
  requireAdmin,
  validate(createFaqSchema),
  postFaq,
);
/** Must be registered before /:faqId routes */
faqRouter.put(
  '/admin/faqs/reorder',
  requireAuth,
  requireAdmin,
  validate(reorderFaqsSchema),
  putReorderFaqs,
);
faqRouter.patch(
  '/admin/faqs/:faqId',
  requireAuth,
  requireAdmin,
  validate(updateFaqSchema),
  patchFaq,
);
faqRouter.delete(
  '/admin/faqs/:faqId',
  requireAuth,
  requireAdmin,
  deleteFaqHandler,
);
