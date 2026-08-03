/**
 * Live class REST routes.
 *
 * Admin:
 *   GET|POST          /live-classes
 *   GET|PUT|DELETE    /live-classes/:id
 *   POST              /live-classes/upload-thumbnail
 *   POST              /live-classes/:id/notify
 *
 * Student:
 *   GET               /live-classes  (same path — public list when not admin)
 *   GET               /live-classes/public  (alias)
 */
import { Router } from 'express';

import {
  getLiveClass,
  listLiveClasses,
  listPublicLiveClasses,
  postLiveClass,
  postLiveClassNotify,
  postLiveClassThumbnail,
  putLiveClass,
  removeLiveClass,
} from '../controllers/liveClass.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { thumbnailUpload } from '../middlewares/upload';
import { validate, validateRequest } from '../middlewares/validate';
import { uuidIdParamSchema } from '../validators/common.validators';
import {
  createLiveClassSchema,
  listLiveClassesQuerySchema,
  notifyLiveClassSchema,
  updateLiveClassSchema,
} from '../validators/liveClass.validators';

export const liveClassRouter = Router();

liveClassRouter.get(
  '/live-classes/public',
  requireAuth,
  validate(listLiveClassesQuerySchema, 'query'),
  listPublicLiveClasses,
);

/**
 * GET /live-classes — students get published list; admins get filtered admin page.
 */
liveClassRouter.get(
  '/live-classes',
  requireAuth,
  validate(listLiveClassesQuerySchema, 'query'),
  listLiveClasses,
);

liveClassRouter.post(
  '/live-classes/upload-thumbnail',
  requireAuth,
  requirePermission('courses:create'),
  thumbnailUpload,
  postLiveClassThumbnail,
);

liveClassRouter.post(
  '/live-classes',
  requireAuth,
  requirePermission('courses:create'),
  validate(createLiveClassSchema),
  postLiveClass,
);

liveClassRouter.post(
  '/live-classes/:id/notify',
  requireAuth,
  requirePermission('courses:create'),
  validateRequest({
    params: uuidIdParamSchema,
    body: notifyLiveClassSchema,
  }),
  postLiveClassNotify,
);

liveClassRouter.get(
  '/live-classes/:id',
  requireAuth,
  requirePermission('courses:read'),
  validate(uuidIdParamSchema, 'params'),
  getLiveClass,
);

liveClassRouter.put(
  '/live-classes/:id',
  requireAuth,
  requirePermission('courses:update'),
  validateRequest({
    params: uuidIdParamSchema,
    body: updateLiveClassSchema,
  }),
  putLiveClass,
);

liveClassRouter.delete(
  '/live-classes/:id',
  requireAuth,
  requirePermission('courses:delete'),
  validate(uuidIdParamSchema, 'params'),
  removeLiveClass,
);
