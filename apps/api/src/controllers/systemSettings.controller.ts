/**
 * System settings HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getPlatformSettings,
  getPublicPlatformConfig,
  updatePlatformSettings,
  uploadPlatformLogo,
} from '../services/systemSettings.service';
import { AppError } from '../utils/AppError';
import type { UpdateSystemSettingsInput } from '../validators/systemSettings.validators';

function assertUser(req: Request): { id: string; email: string | null } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return {
    id: req.user.id,
    email: req.user.email ?? null,
  };
}

/** GET /public/platform — unauthenticated branding + maintenance flag */
export async function getPublicPlatformHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getPublicPlatformConfig();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/settings */
export async function getAdminSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const data = await getPlatformSettings({ bypassCache: true });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PUT /admin/settings */
export async function updateAdminSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = assertUser(req);
    const body = req.body as UpdateSystemSettingsInput;
    const data = await updatePlatformSettings({
      general: body.general,
      actor_id: user.id,
      actor_email: user.email,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/settings/logo */
export async function uploadAdminLogoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = assertUser(req);
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'LOGO_REQUIRED', 'Multipart field "logo" is required');
    }
    const data = await uploadPlatformLogo({
      actor_id: user.id,
      actor_email: user.email,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
