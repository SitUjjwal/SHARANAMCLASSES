/**
 * Client activity event routes (auth login/logout).
 *
 *   POST /activity/events
 */
import { Router } from 'express';

import { postActivityEventHandler } from '../controllers/activityLog.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { clientActivityEventSchema } from '../validators/activityLog.validators';

export const activityLogRouter = Router();

activityLogRouter.post(
  '/activity/events',
  requireAuth,
  validate(clientActivityEventSchema),
  postActivityEventHandler,
);
