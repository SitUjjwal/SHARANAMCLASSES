/**
 * Batch → Subject routes.
 *
 * Batches are stored in `courses`; these routes provide the batch-first API:
 *   GET|POST          /batches                (alias of courses w/ batch rules)
 *   GET|PUT|DELETE    /batches/:id
 *   GET|POST          /batches/:id/subjects
 *   PUT               /batches/:id/subjects/reorder
 *   DELETE            /batches/:id/subjects/:subjectId
 *   GET|POST          /subjects, PUT|PATCH|DELETE /subjects/:id
 *   GET|PATCH         /batch-subjects/:id
 *   GET|POST          /batch-subjects/:id/chapters
 *
 * Student:
 *   GET /student/batches/:id/subjects
 *   GET /student/batch-subjects/:id/chapters
 */
import { Router } from 'express';

import {
  getCourse,
  listCourses,
  patchCourse,
  postCourse,
  removeCourse,
} from '../controllers/course.controller';
import {
  deleteBatchSubject,
  getBatchSubjectChapters,
  getBatchSubjectDetail,
  getBatchSubjectList,
  getStudentBatchSubjectChapters,
  getStudentBatchSubjects,
  getSubjects,
  patchBatchSubject,
  patchSubject,
  postBatchSubjectChapter,
  postBatchSubjects,
  postSubject,
  putReorderBatchSubjects,
  removeSubject,
} from '../controllers/subject.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate, validateRequest } from '../middlewares/validate';
import { uuidIdParamSchema } from '../validators/common.validators';
import {
  createBatchSchema,
  createChapterSchema,
  getCoursesQuerySchema,
  updateBatchSchema,
} from '../validators/course.validators';
import {
  addBatchSubjectsSchema,
  createSubjectSchema,
  listSubjectsQuerySchema,
  reorderBatchSubjectsSchema,
  updateBatchSubjectSchema,
  updateSubjectSchema,
} from '../validators/subject.validators';

export const batchRouter = Router();

// ---- Batches (courses with batch validation rules) ----
batchRouter.get(
  '/batches',
  requireAuth,
  validate(getCoursesQuerySchema, 'query'),
  listCourses,
);
batchRouter.post(
  '/batches',
  requireAuth,
  requirePermission('courses:create'),
  validate(createBatchSchema),
  postCourse,
);
batchRouter.get(
  '/batches/:id',
  requireAuth,
  validate(uuidIdParamSchema, 'params'),
  getCourse,
);
batchRouter.put(
  '/batches/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: updateBatchSchema }),
  patchCourse,
);
batchRouter.delete(
  '/batches/:id',
  requireAuth,
  requirePermission('courses:delete'),
  validate(uuidIdParamSchema, 'params'),
  removeCourse,
);

// ---- Subjects master catalog ----
batchRouter.get(
  '/subjects',
  requireAuth,
  validate(listSubjectsQuerySchema, 'query'),
  getSubjects,
);
batchRouter.post(
  '/subjects',
  requireAuth,
  requirePermission('courses:create'),
  validate(createSubjectSchema),
  postSubject,
);
batchRouter.put(
  '/subjects/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: updateSubjectSchema }),
  patchSubject,
);
batchRouter.patch(
  '/subjects/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: updateSubjectSchema }),
  patchSubject,
);
batchRouter.delete(
  '/subjects/:id',
  requireAuth,
  requirePermission('courses:delete'),
  validate(uuidIdParamSchema, 'params'),
  removeSubject,
);

// ---- Batch ↔ subjects ----
batchRouter.get(
  '/batches/:id/subjects',
  requireAuth,
  requirePermission('courses:read'),
  validate(uuidIdParamSchema, 'params'),
  getBatchSubjectList,
);
batchRouter.post(
  '/batches/:id/subjects',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: addBatchSubjectsSchema }),
  postBatchSubjects,
);
batchRouter.put(
  '/batches/:id/subjects/reorder',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: reorderBatchSubjectsSchema }),
  putReorderBatchSubjects,
);
batchRouter.delete(
  '/batches/:id/subjects/:subjectId',
  requireAuth,
  requirePermission('courses:update'),
  deleteBatchSubject,
);

batchRouter.get(
  '/batch-subjects/:id',
  requireAuth,
  requirePermission('courses:read'),
  validate(uuidIdParamSchema, 'params'),
  getBatchSubjectDetail,
);
batchRouter.patch(
  '/batch-subjects/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({ params: uuidIdParamSchema, body: updateBatchSubjectSchema }),
  patchBatchSubject,
);

// ---- Chapters inside a subject ----
batchRouter.get(
  '/batch-subjects/:id/chapters',
  requireAuth,
  requirePermission('courses:read'),
  validate(uuidIdParamSchema, 'params'),
  getBatchSubjectChapters,
);
batchRouter.post(
  '/batch-subjects/:id/chapters',
  requireAuth,
  requirePermission('courses:create'),
  validateRequest({ params: uuidIdParamSchema, body: createChapterSchema }),
  postBatchSubjectChapter,
);

// ---- Student ----
batchRouter.get(
  '/student/batches/:id/subjects',
  requireAuth,
  validate(uuidIdParamSchema, 'params'),
  getStudentBatchSubjects,
);
batchRouter.get(
  '/student/batch-subjects/:id/chapters',
  requireAuth,
  validate(uuidIdParamSchema, 'params'),
  getStudentBatchSubjectChapters,
);
