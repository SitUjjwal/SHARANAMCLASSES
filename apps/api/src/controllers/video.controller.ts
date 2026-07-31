/**
 * Video HTTP handlers — admin flat REST + thumbnail upload reuse.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createVideo,
  deleteVideo,
  getVideoForAdmin,
  listVideosForAdmin,
  updateVideo,
} from '../services/video.service';
import { uploadCourseThumbnail } from '../services/upload.service';
import type {
  CreateVideoInput,
  ListVideosQuery,
  UpdateVideoInput,
} from '../validators/video.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

/** GET /videos */
export async function listVideos(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as ListVideosQuery;
    const data = await listVideosForAdmin(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /videos/:id */
export async function getVideo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const videoId = requireParam(req.params.id, 'id');
    const data = await getVideoForAdmin(videoId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /videos */
export async function postVideo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateVideoInput;
    const data = await createVideo(input);
    res.status(201).json({ success: true, data, message: 'Video created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /videos/:id */
export async function putVideo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const videoId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateVideoInput;
    const data = await updateVideo(videoId, input);
    res.status(200).json({ success: true, data, message: 'Video updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /videos/:id */
export async function removeVideo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const videoId = requireParam(req.params.id, 'id');
    await deleteVideo(videoId);
    res.status(200).json({ success: true, data: null, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /videos/upload-thumbnail — multipart field `thumbnail` */
export async function postVideoThumbnail(
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
