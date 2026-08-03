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
  getCourseContentHandler,
  listAdminChapters,
  listChapterNotes,
  listChapterPdfs,
  listChapters,
  listChapterVideos,
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
import { requirePermission } from '../middlewares/requirePermission';
import {
  attachCourseAccessFromChapter,
  attachCourseAccessFromCourse,
} from '../middlewares/courseAccess';
import { thumbnailUpload, materialUpload } from '../middlewares/upload';
import { validate, validateRequest } from '../middlewares/validate';
import { uuidIdParamSchema } from '../validators/common.validators';
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
  requirePermission('courses:create'),
  validate(createCourseSchema),
  postCourse,
);
courseRouter.post(
  '/courses/upload-thumbnail',
  requireAuth,
  requirePermission('courses:create'),
  thumbnailUpload,
  postCourseThumbnail,
);
courseRouter.put(
  '/courses/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({
    params: uuidIdParamSchema,
    body: updateCourseSchema,
  }),
  patchCourse,
);
courseRouter.delete(
  '/courses/:id',
  requireAuth,
  requirePermission('courses:delete'),
  validate(uuidIdParamSchema, 'params'),
  removeCourse,
);

// Student / shared detail + enroll (content gated by course-access middleware)
courseRouter.get(
  '/courses/:id',
  requireAuth,
  validate(uuidIdParamSchema, 'params'),
  getCourse,
);
courseRouter.get(
  '/courses/:id/content',
  requireAuth,
  attachCourseAccessFromCourse,
  getCourseContentHandler,
);
courseRouter.post('/courses/:id/enroll', requireAuth, postEnrollCourse);
courseRouter.get(
  '/courses/:id/chapters',
  requireAuth,
  attachCourseAccessFromCourse,
  listChapters,
);
courseRouter.get(
  '/courses/:id/chapters/:chapterId',
  requireAuth,
  attachCourseAccessFromCourse,
  getChapter,
);

// ---- Flat chapters (primary) ----
courseRouter.get(
  '/chapters',
  requireAuth,
  requirePermission('courses:read'),
  validate(adminListChaptersQuerySchema, 'query'),
  listAdminChapters,
);
courseRouter.post(
  '/chapters',
  requireAuth,
  requirePermission('courses:create'),
  validate(createChapterWithCourseSchema),
  postChapterFlat,
);
courseRouter.put(
  '/chapters/reorder',
  requireAuth,
  requirePermission('courses:update'),
  validate(reorderChaptersFlatSchema),
  putReorderChaptersFlat,
);
courseRouter.post(
  '/chapters/upload-material',
  requireAuth,
  requirePermission('courses:create'),
  materialUpload,
  postChapterMaterial,
);
courseRouter.get(
  '/chapters/:id/videos',
  requireAuth,
  attachCourseAccessFromChapter,
  listChapterVideos,
);
courseRouter.get(
  '/chapters/:id/pdfs',
  requireAuth,
  attachCourseAccessFromChapter,
  listChapterPdfs,
);
courseRouter.get(
  '/chapters/:id/notes',
  requireAuth,
  attachCourseAccessFromChapter,
  listChapterNotes,
);
courseRouter.put(
  '/chapters/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.delete('/chapters/:id', requireAuth, requirePermission('courses:delete'), removeChapter);

courseRouter.get(
  '/chapters/:id/contents',
  requireAuth,
  requirePermission('courses:read'),
  listContents,
);
courseRouter.post(
  '/chapters/:id/contents',
  requireAuth,
  requirePermission('courses:create'),
  validate(createChapterContentSchema),
  postContent,
);
courseRouter.put(
  '/contents/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateChapterContentSchema),
  patchContent,
);
courseRouter.delete('/contents/:id', requireAuth, requirePermission('courses:delete'), removeContent);

// ---- Legacy /admin aliases (same handlers) ----
courseRouter.get(
  '/admin/courses',
  requireAuth,
  requirePermission('courses:read'),
  validate(adminListCoursesQuerySchema, 'query'),
  listAdminCourses,
);
courseRouter.post(
  '/admin/courses/upload-thumbnail',
  requireAuth,
  requirePermission('courses:create'),
  thumbnailUpload,
  postCourseThumbnail,
);
courseRouter.get('/admin/courses/:courseId', requireAuth, requirePermission('courses:read'), getAdminCourse);
courseRouter.post(
  '/admin/courses',
  requireAuth,
  requirePermission('courses:create'),
  validate(createCourseSchema),
  postCourse,
);
courseRouter.patch(
  '/admin/courses/:courseId',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateCourseSchema),
  patchCourse,
);
courseRouter.put(
  '/admin/courses/:courseId',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateCourseSchema),
  patchCourse,
);
courseRouter.delete(
  '/admin/courses/:courseId',
  requireAuth,
  requirePermission('courses:delete'),
  removeCourse,
);
courseRouter.get(
  '/admin/courses/:courseId/chapters',
  requireAuth,
  requirePermission('courses:read'),
  validate(adminListChaptersQuerySchema, 'query'),
  listAdminChapters,
);
courseRouter.put(
  '/admin/courses/:courseId/chapters/reorder',
  requireAuth,
  requirePermission('courses:update'),
  validate(reorderChaptersSchema),
  putReorderChapters,
);
courseRouter.post(
  '/admin/courses/:courseId/chapters',
  requireAuth,
  requirePermission('courses:create'),
  validate(createChapterSchema),
  postChapter,
);
courseRouter.patch(
  '/admin/chapters/:chapterId',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.put(
  '/admin/chapters/:chapterId',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateChapterSchema),
  patchChapter,
);
courseRouter.delete(
  '/admin/chapters/:chapterId',
  requireAuth,
  requirePermission('courses:delete'),
  removeChapter,
);
