/**
 * Device push-token HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  deactivateDevicePushToken,
  upsertDevicePushToken,
} from '../services/devicePush.service';
import { AppError } from '../utils/AppError';
import type {
  DeactivatePushTokenInput,
  UpsertPushTokenInput,
} from '../validators/devicePush.validators';

export async function putDevicePushToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }
    const input = req.body as UpsertPushTokenInput;
    const data = await upsertDevicePushToken(userId, input);
    res.status(200).json({
      success: true,
      data,
      message: 'Push token registered',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDevicePushToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
    }
    const input = req.body as DeactivatePushTokenInput;
    await deactivateDevicePushToken(userId, input);
    res.status(200).json({
      success: true,
      data: null,
      message: 'Push token deactivated',
    });
  } catch (error) {
    next(error);
  }
}
