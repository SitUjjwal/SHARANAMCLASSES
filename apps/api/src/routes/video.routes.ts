/**
 * Video REST routes.
 *
 * Student:
 *   GET|PUT  /videos/:videoId/progress   — Continue Watching position
 *   GET      /continue-watching
 *
 * Admin:
 *   GET|POST          /videos
 *   GET|PUT|DELETE    /videos/:id
 *   POST              /videos/upload-thumbnail
 */
import { Router } from 'express';

import {
  getVideo,
  listVideos,
  postVideo,
  postVideoThumbnail,
  putVideo,
  removeVideo,
} from '../controllers/video.controller';
import {
  getContinueWatching,
  getVideoProgress,
  putVideoProgress,
} from '../controllers/videoWatchProgress.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { thumbnailUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createVideoSchema,
  listVideosQuerySchema,
  updateVideoSchema,
} from '../validators/video.validators';
import { upsertVideoWatchProgressSchema } from '../validators/videoWatchProgress.validators';

export const videoRouter = Router();

videoRouter.get('/continue-watching', requireAuth, getContinueWatching);

videoRouter.get('/videos/:videoId/progress', requireAuth, getVideoProgress);
videoRouter.put(
  '/videos/:videoId/progress',
  requireAuth,
  validate(upsertVideoWatchProgressSchema),
  putVideoProgress,
);

videoRouter.get(
  '/videos',
  requireAuth,
  requirePermission('courses:read'),
  validate(listVideosQuerySchema, 'query'),
  listVideos,
);

videoRouter.post(
  '/videos/upload-thumbnail',
  requireAuth,
  requirePermission('courses:create'),
  thumbnailUpload,
  postVideoThumbnail,
);

videoRouter.post(
  '/videos',
  requireAuth,
  requirePermission('courses:create'),
  validate(createVideoSchema),
  postVideo,
);

videoRouter.get('/videos/:id', requireAuth, requirePermission('courses:read'), getVideo);

videoRouter.put(
  '/videos/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updateVideoSchema),
  putVideo,
);

videoRouter.delete('/videos/:id', requireAuth, requirePermission('courses:delete'), removeVideo);
