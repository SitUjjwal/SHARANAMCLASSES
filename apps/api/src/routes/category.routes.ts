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
import { requirePermission } from '../middlewares/requirePermission';
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
  requirePermission('courses:create'),
  validate(createCategorySchema),
  postCategory,
);
categoryRouter.patch(
  '/categories/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateCategorySchema),
  patchCategory,
);
categoryRouter.delete('/categories/:id', requireAuth, requirePermission('courses:delete'), removeCategory);
categoryRouter.get('/admin/categories', requireAuth, requirePermission('courses:read'), listAdminCategories);
