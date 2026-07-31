/**
 * Course HTTP handlers — student browse + admin CRUD.
 *
 * Controllers (this file) only:
 * 1. Read auth / params / validated body
 * 2. Call the matching service
 * 3. Shape the HTTP JSON response
 * They never talk to Supabase directly — that stays in services.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createCourse,
  deleteCourse,
  enrollInCourse,
  getCourseDetail,
  getCourseForAdmin,
  listCoursesForAdmin,
  listPublishedCourses,
  updateCourse,
} from '../services/course.service';
import { uploadChapterMaterial, uploadCourseThumbnail } from '../services/upload.service';
import type {
  AdminListCoursesQuery,
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from '../validators/course.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import { isAdminUser } from '../services/role.service';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

function courseIdParam(req: Request): string {
  return requireParam(req.params.id ?? req.params.courseId, 'id');
}

/**
 * GET /courses
 * - Admin → paginated catalog including inactive (status/search filters)
 * - Student → published catalog only
 */
export async function listCourses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const admin = await isAdminUser(userId, req.user?.email);

    if (admin) {
      const filters = req.query as unknown as AdminListCoursesQuery;
      const data = await listCoursesForAdmin({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        categoryId:
          typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        status:
          req.query.status === 'active' ||
          req.query.status === 'inactive' ||
          req.query.status === 'all'
            ? req.query.status
            : 'all',
        price:
          req.query.price === 'free' ||
          req.query.price === 'paid' ||
          req.query.price === 'all'
            ? req.query.price
            : 'all',
        classLevel:
          typeof req.query.classLevel === 'string' ? req.query.classLevel : undefined,
        medium:
          req.query.medium === 'hindi' || req.query.medium === 'english'
            ? req.query.medium
            : undefined,
        stream:
          req.query.stream === 'science' ||
          req.query.stream === 'arts' ||
          req.query.stream === 'commerce'
            ? req.query.stream
            : undefined,
        board:
          req.query.board === 'bihar_board' || req.query.board === 'other'
            ? req.query.board
            : undefined,
        academicYear:
          typeof req.query.academicYear === 'string' ? req.query.academicYear : undefined,
        subject: typeof req.query.subject === 'string' ? req.query.subject : undefined,
        page: Number(req.query.page) || filters.page || 1,
        pageSize: Number(req.query.pageSize) || filters.pageSize || 10,
      });
      res.status(200).json({ success: true, data });
      return;
    }

    const filters = req.query as unknown as ListCoursesQuery;
    const data = await listPublishedCourses(userId, filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/courses — alias of admin branch of GET /courses */
export async function listAdminCourses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as AdminListCoursesQuery;
    const data = await listCoursesForAdmin(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /courses/:id (admin) or GET /admin/courses/:id */
export async function getAdminCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    const data = await getCourseForAdmin(courseId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /courses/:id — student detail (published) */
export async function getCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    const userId = assertUserId(req);
    const admin = await isAdminUser(userId, req.user?.email);
    if (admin) {
      const data = await getCourseForAdmin(courseId);
      res.status(200).json({ success: true, data });
      return;
    }
    const data = await getCourseDetail(courseId, userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /courses/:id/enroll */
export async function postEnrollCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = courseIdParam(req);
    const data = await enrollInCourse(userId, courseId);
    res.status(200).json({
      success: true,
      data,
      message: 'Enrolled successfully',
    });
  } catch (error) {
    next(error);
  }
}

/** POST /courses — create (admin) */
export async function postCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const input = req.body as CreateCourseInput;
    const data = await createCourse(input, userId);
    res.status(201).json({ success: true, data, message: 'Course created' });
  } catch (error) {
    next(error);
  }
}

/** PUT|PATCH /courses/:id — update (admin) */
export async function patchCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    const input = req.body as UpdateCourseInput;
    const data = await updateCourse(courseId, input);
    res.status(200).json({ success: true, data, message: 'Course updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /courses/:id */
export async function removeCourse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    await deleteCourse(courseId);
    res.status(200).json({ success: true, data: null, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/courses/upload-thumbnail — multipart field `thumbnail` */
export async function postCourseThumbnail(
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

/** POST /chapters/upload-material — multipart field `file` (PDF/notes) */
export async function postChapterMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'FILE_REQUIRED', 'Attach a file as field "file"');
    }
    const url = await uploadChapterMaterial(file);
    res.status(200).json({
      success: true,
      data: { url },
      message: 'File uploaded',
    });
  } catch (error) {
    next(error);
  }
}
