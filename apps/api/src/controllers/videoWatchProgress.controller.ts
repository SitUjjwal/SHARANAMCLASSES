/**
 * Video watch progress HTTP handlers — Continue Watching.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getContinueWatchingForUser,
  getVideoWatchProgress,
  upsertVideoWatchProgress,
} from '../services/videoWatchProgress.service';
import type { UpsertVideoWatchProgressBody } from '../validators/videoWatchProgress.validators';
import { AppError } from '../utils/AppError';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

function paramId(value: string | string[] | undefined, label: string): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new AppError(400, 'PARAM_REQUIRED', `${label} is required`);
  }
  return id;
}

/** PUT /videos/:videoId/progress */
export async function putVideoProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const videoId = paramId(req.params.videoId, 'videoId');
    const body = req.body as UpsertVideoWatchProgressBody;
    const data = await upsertVideoWatchProgress(userId, videoId, body);
    res.status(200).json({ success: true, data, message: 'Progress saved' });
  } catch (error) {
    next(error);
  }
}

/** GET /videos/:videoId/progress */
export async function getVideoProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const videoId = paramId(req.params.videoId, 'videoId');
    const data = await getVideoWatchProgress(userId, videoId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /continue-watching */
export async function getContinueWatching(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await getContinueWatchingForUser(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
