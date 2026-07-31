/**
 * Category routes.
 *
 *   GET  /categories
 *   POST /categories
 *   GET  /admin/categories  (alias)
 */
import { Router } from 'express';

import {
  listAdminCategories,
  listCategories,
  postCategory,
} from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { createCategorySchema } from '../validators/category.validators';

export const categoryRouter = Router();

categoryRouter.get('/categories', requireAuth, listCategories);
categoryRouter.post(
  '/categories',
  requireAuth,
  requireAdmin,
  validate(createCategorySchema),
  postCategory,
);
categoryRouter.get('/admin/categories', requireAuth, requireAdmin, listAdminCategories);
