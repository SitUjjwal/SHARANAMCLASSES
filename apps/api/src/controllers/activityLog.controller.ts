/**
 * Activity log HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import { recordClientActivityEvent } from '../services/activityLog.service';
import { AppError } from '../utils/AppError';
import type { ClientActivityEventInput } from '../validators/activityLog.validators';

export async function postActivityEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const body = req.body as ClientActivityEventInput;
    await recordClientActivityEvent({
      userId: req.user.id,
      email: req.user.email ?? null,
      action: body.action,
      metadata: body.metadata,
    });
    res.status(201).json({ success: true, data: { recorded: true } });
  } catch (error) {
    next(error);
  }
}
