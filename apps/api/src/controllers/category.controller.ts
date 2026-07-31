/**
 * Category HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createCategory,
  listActiveCategories,
  listAllCategoriesForAdmin,
} from '../services/category.service';
import { isAdminUser } from '../services/role.service';
import type { CreateCategoryInput } from '../validators/category.validators';
import { AppError } from '../utils/AppError';

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
