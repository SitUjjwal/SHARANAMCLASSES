/**
 * Video REST routes (admin).
 *
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
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { thumbnailUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createVideoSchema,
  listVideosQuerySchema,
  updateVideoSchema,
} from '../validators/video.validators';

export const videoRouter = Router();

videoRouter.get(
  '/videos',
  requireAuth,
  requireAdmin,
  validate(listVideosQuerySchema, 'query'),
  listVideos,
);

videoRouter.post(
  '/videos/upload-thumbnail',
  requireAuth,
  requireAdmin,
  thumbnailUpload,
  postVideoThumbnail,
);

videoRouter.post(
  '/videos',
  requireAuth,
  requireAdmin,
  validate(createVideoSchema),
  postVideo,
);

videoRouter.get('/videos/:id', requireAuth, requireAdmin, getVideo);

videoRouter.put(
  '/videos/:id',
  requireAuth,
  requireAdmin,
  validate(updateVideoSchema),
  putVideo,
);

videoRouter.delete('/videos/:id', requireAuth, requireAdmin, removeVideo);
