/**
 * Category HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createCategory,
  deleteCategory,
  listActiveCategories,
  listAllCategoriesForAdmin,
  updateCategory,
} from '../services/category.service';
import { isAdminUser } from '../services/role.service';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

/**
 * GET /categories
 * - Admin → all categories
 * - Student → active only (+ optional search)
 */
export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }

    const admin = await isAdminUser(userId, req.user?.email);
    if (admin) {
      const data = await listAllCategoriesForAdmin();
      res.status(200).json({ success: true, data });
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const data = await listActiveCategories(search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/categories — alias */
export async function listAdminCategories(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listAllCategoriesForAdmin();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /categories — create (admin) */
export async function postCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateCategoryInput;
    const data = await createCategory(input);
    res.status(201).json({ success: true, data, message: 'Category created' });
  } catch (error) {
    next(error);
  }
}

/** PATCH /categories/:id — update (admin) */
export async function patchCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categoryId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateCategoryInput;
    const data = await updateCategory(categoryId, input);
    res.status(200).json({ success: true, data, message: 'Category updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /categories/:id — delete (admin) */
export async function removeCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categoryId = requireParam(req.params.id, 'id');
    await deleteCategory(categoryId);
    res.status(200).json({ success: true, data: null, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}
