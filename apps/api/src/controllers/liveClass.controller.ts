/**
 * Live class HTTP handlers — admin CRUD + thumbnail + notify.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createLiveClass,
  deleteLiveClass,
  getLiveClassForAdmin,
  listLiveClassesForAdmin,
  listLiveClassesPublic,
  notifyLiveClass,
  updateLiveClass,
} from '../services/liveClass.service';
import { hasStaffPermission } from '../services/role.service';
import { uploadCourseThumbnail } from '../services/upload.service';
import type {
  CreateLiveClassInput,
  ListLiveClassesQuery,
  NotifyLiveClassInput,
  UpdateLiveClassInput,
} from '../validators/liveClass.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

/**
 * GET /live-classes
 * - Admin → paginated admin list (query filters)
 * - Student → published public list (optional courseId)
 */
export async function listLiveClasses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }

    const admin = await hasStaffPermission(req.user.id, 'courses:read', req.user.email);
    if (admin) {
      const filters = req.query as unknown as ListLiveClassesQuery;
      const data = await listLiveClassesForAdmin(filters);
      res.status(200).json({ success: true, data });
      return;
    }

    const courseId =
      typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const page = typeof req.query.page === 'number' ? req.query.page : Number(req.query.page) || 1;
    const pageSize =
      typeof req.query.pageSize === 'number'
        ? req.query.pageSize
        : Number(req.query.pageSize) || 20;
    const data = await listLiveClassesPublic({ courseId, page, pageSize });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /live-classes/public — alias for student list (kept for existing clients) */
export async function listPublicLiveClasses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId =
      typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const data = await listLiveClassesPublic({ courseId, page, pageSize });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /live-classes/:id */
export async function getLiveClass(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = requireParam(req.params.id, 'id');
    const data = await getLiveClassForAdmin(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /live-classes */
export async function postLiveClass(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateLiveClassInput;
    const data = await createLiveClass(input);
    res.status(201).json({ success: true, data, message: 'Live class created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /live-classes/:id */
export async function putLiveClass(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = requireParam(req.params.id, 'id');
    const input = req.body as UpdateLiveClassInput;
    const data = await updateLiveClass(id, input);
    res.status(200).json({ success: true, data, message: 'Live class updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /live-classes/:id */
export async function removeLiveClass(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = requireParam(req.params.id, 'id');
    await deleteLiveClass(id);
    res.status(200).json({ success: true, data: null, message: 'Live class deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /live-classes/upload-thumbnail */
export async function postLiveClassThumbnail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'THUMBNAIL_REQUIRED', 'Attach an image as field "thumbnail"');
    }
    const url = await uploadCourseThumbnail(file);
    res.status(200).json({
      success: true,
      data: { url },
      message: 'Thumbnail uploaded',
    });
  } catch (error) {
    next(error);
  }
}

/** POST /live-classes/:id/notify */
export async function postLiveClassNotify(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = requireParam(req.params.id, 'id');
    const input = (req.body ?? {}) as NotifyLiveClassInput;
    const data = await notifyLiveClass(id, input);
    res.status(200).json({
      success: true,
      data,
      message: 'Notification sent (in-app update published)',
    });
  } catch (error) {
    next(error);
  }
}
