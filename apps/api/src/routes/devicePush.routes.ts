/**
 * Device push token routes.
 *
 * PUT    /devices/push-token   — register / refresh token (auth)
 * DELETE /devices/push-token   — deactivate token (auth)
 */
import { Router } from 'express';

import {
  deleteDevicePushToken,
  putDevicePushToken,
} from '../controllers/devicePush.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  deactivatePushTokenSchema,
  upsertPushTokenSchema,
} from '../validators/devicePush.validators';

export const devicePushRouter = Router();

devicePushRouter.put(
  '/devices/push-token',
  requireAuth,
  validate(upsertPushTokenSchema),
  putDevicePushToken,
);

devicePushRouter.delete(
  '/devices/push-token',
  requireAuth,
  validate(deactivatePushTokenSchema),
  deleteDevicePushToken,
);
