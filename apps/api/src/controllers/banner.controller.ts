/**
 * Banner HTTP handlers — public active list + admin CRUD.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createBanner,
  deleteBanner,
  listActiveBanners,
  listAllBannersForAdmin,
  updateBanner,
} from '../services/banner.service';
import { uploadCourseThumbnail } from '../services/upload.service';
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from '../validators/banner.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

export async function listBanners(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listActiveBanners();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listAdminBanners(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listAllBannersForAdmin();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function postBanner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateBannerInput;
    const data = await createBanner(input);
    res.status(201).json({ success: true, data, message: 'Banner created' });
  } catch (error) {
    next(error);
  }
}

export async function patchBanner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bannerId = requireParam(req.params.bannerId, 'bannerId');
    const input = req.body as UpdateBannerInput;
    const data = await updateBanner(bannerId, input);
    res.status(200).json({ success: true, data, message: 'Banner updated' });
  } catch (error) {
    next(error);
  }
}

export async function removeBanner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bannerId = requireParam(req.params.bannerId, 'bannerId');
    await deleteBanner(bannerId);
    res.status(200).json({ success: true, data: null, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/banners/upload-image — multipart field `image` or `thumbnail`. */
export async function postBannerImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'FILE_REQUIRED', 'Upload an image file (field: image)');
    }
    const url = await uploadCourseThumbnail(file);
    res.status(201).json({ success: true, data: { url }, message: 'Image uploaded' });
  } catch (error) {
    next(error);
  }
}
