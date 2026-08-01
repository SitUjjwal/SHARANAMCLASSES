/**
 * Category routes.
 *
 *   GET    /categories
 *   POST   /categories
 *   PATCH  /categories/:id
 *   DELETE /categories/:id
 *   GET    /admin/categories  (alias)
 */
import { Router } from 'express';

import {
  listAdminCategories,
  listCategories,
  patchCategory,
  postCategory,
  removeCategory,
} from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validators';

export const categoryRouter = Router();

categoryRouter.get('/categories', requireAuth, listCategories);
categoryRouter.post(
  '/categories',
  requireAuth,
  requireAdmin,
  validate(createCategorySchema),
  postCategory,
);
categoryRouter.patch(
  '/categories/:id',
  requireAuth,
  requireAdmin,
  validate(updateCategorySchema),
  patchCategory,
);
categoryRouter.delete('/categories/:id', requireAuth, requireAdmin, removeCategory);
categoryRouter.get('/admin/categories', requireAuth, requireAdmin, listAdminCategories);
