/**
 * REST catalog routes (flat + nested student helpers).
 *
 * Primary (requested):
 *   GET|POST          /courses
 *   PUT|DELETE        /courses/:id
 *   GET|POST          /chapters
 *   PUT|DELETE        /chapters/:id
 *   GET|POST          /categories
 *
 * Also kept for mobile / older admin clients:
 *   GET  /courses/:id/chapters, enroll, nested chapter content
 *   /admin/* aliases
 */
import { Router } from 'express';

import {
  getAdminCourse,
  getCourse,
  listAdminCourses,
  listCourses,
  patchCourse,
  postChapterMaterial,
  postCourse,
  postCourseThumbnail,
  postEnrollCourse,
  removeCourse,
} from '../controllers/course.controller';
import {
  getChapter,
  listAdminChapters,
  listChapters,
  listContents,
  patchChapter,
  patchContent,
  postChapter,
  postChapterFlat,
  postContent,
  putReorderChapters,
  putReorderChaptersFlat,
  removeChapter,
  removeContent,
} from '../controllers/chapter.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { thumbnailUpload, materialUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  adminListChaptersQuerySchema,
  adminListCoursesQuerySchema,
  createChapterContentSchema,
  createChapterSchema,
  createChapterWithCourseSchema,
  createCourseSchema,
  getCoursesQuerySchema,
  reorderChaptersFlatSchema,
  reorderChaptersSchema,
  updateChapterContentSchema,
  updateChapterSchema,
  updateCourseSchema,
} from '../validators/course.validators';

export const courseRouter = Router();

// ---- Flat courses (primary) ----
courseRouter.get(
  '/courses',
  requireAuth,
  validate(getCoursesQuerySchema, 'query'),
  listCourses,
);
courseRouter.post(
  '/courses',
  requireAuth,
  requireAdmin,
  validate(createCourseSchema),
  postCourse,
);
courseRouter.post(
  '/courses/upload-thumbnail',
  requireAuth,
  requireAdmin,
  thumbnailUpload,
  postCourseThumbnail,
);
courseRouter.put(
  '/courses/:id',
  requireAuth,
  requireAdmin,
  validate(updateCourseSchema),
  patchCourse,
);
courseRouter.delete('/courses/:id', requireAuth, requireAdmin, removeCourse);

// Student / shared detail + enroll
courseRouter.get('/courses/:id', requireAuth, getCourse);
courseRouter.post('/courses/:id/enroll', requireAuth, postEnrollCourse);
courseRouter.get('/courses/:id/chapters', requireAuth, listChapters);
courseRouter.get('/courses/:id/chapters/:chapterId', requireAuth, getChapter);

// ---- Flat chapters (primary) ----
courseRouter.get(
  '/chapters',
  requireAuth,
  requireAdmin,
  validate(adminListChaptersQuerySchema, 'query'),
  listAdminChapters,
);
courseRouter.post(
  '/chapters',
  requireAuth,
  requireAdmin,
  validate(createChapterWithCourseSchema),
  postChapterFlat,
);
courseRouter.put(
  '/chapters/reorder',
  requireAuth,
  requireAdmin,
  validate(reorderChaptersFlatSchema),
  putReorderChaptersFlat,
);
courseRouter.post(
  '/chapters/upload-material',
  requireAuth,
  requireAdmin,
  materialUpload,
  postChapterMaterial,
);
courseRouter.put(
  '/chapters/:id',
  requireAuth,
  requireAdmin,
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.delete('/chapters/:id', requireAuth, requireAdmin, removeChapter);

courseRouter.get(
  '/chapters/:id/contents',
  requireAuth,
  requireAdmin,
  listContents,
);
courseRouter.post(
  '/chapters/:id/contents',
  requireAuth,
  requireAdmin,
  validate(createChapterContentSchema),
  postContent,
);
courseRouter.put(
  '/contents/:id',
  requireAuth,
  requireAdmin,
  validate(updateChapterContentSchema),
  patchContent,
);
courseRouter.delete('/contents/:id', requireAuth, requireAdmin, removeContent);

// ---- Legacy /admin aliases (same handlers) ----
courseRouter.get(
  '/admin/courses',
  requireAuth,
  requireAdmin,
  validate(adminListCoursesQuerySchema, 'query'),
  listAdminCourses,
);
courseRouter.post(
  '/admin/courses/upload-thumbnail',
  requireAuth,
  requireAdmin,
  thumbnailUpload,
  postCourseThumbnail,
);
courseRouter.get('/admin/courses/:courseId', requireAuth, requireAdmin, getAdminCourse);
courseRouter.post(
  '/admin/courses',
  requireAuth,
  requireAdmin,
  validate(createCourseSchema),
  postCourse,
);
courseRouter.patch(
  '/admin/courses/:courseId',
  requireAuth,
  requireAdmin,
  validate(updateCourseSchema),
  patchCourse,
);
courseRouter.put(
  '/admin/courses/:courseId',
  requireAuth,
  requireAdmin,
  validate(updateCourseSchema),
  patchCourse,
);
courseRouter.delete(
  '/admin/courses/:courseId',
  requireAuth,
  requireAdmin,
  removeCourse,
);
courseRouter.get(
  '/admin/courses/:courseId/chapters',
  requireAuth,
  requireAdmin,
  validate(adminListChaptersQuerySchema, 'query'),
  listAdminChapters,
);
courseRouter.put(
  '/admin/courses/:courseId/chapters/reorder',
  requireAuth,
  requireAdmin,
  validate(reorderChaptersSchema),
  putReorderChapters,
);
courseRouter.post(
  '/admin/courses/:courseId/chapters',
  requireAuth,
  requireAdmin,
  validate(createChapterSchema),
  postChapter,
);
courseRouter.patch(
  '/admin/chapters/:chapterId',
  requireAuth,
  requireAdmin,
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.put(
  '/admin/chapters/:chapterId',
  requireAuth,
  requireAdmin,
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.delete(
  '/admin/chapters/:chapterId',
  requireAuth,
  requireAdmin,
  removeChapter,
);
