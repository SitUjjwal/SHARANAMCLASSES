/**
 * Announcement HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createAnnouncement,
  deleteAnnouncement,
  listAllAnnouncementsForAdmin,
  listPublishedAnnouncements,
  updateAnnouncement,
} from '../services/announcement.service';
import { uploadCourseThumbnail } from '../services/upload.service';
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../validators/announcement.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

export async function listAnnouncements(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listPublishedAnnouncements();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listAdminAnnouncements(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listAllAnnouncementsForAdmin();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function postAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateAnnouncementInput;
    const data = await createAnnouncement(input, req.user?.id ?? null);
    res.status(201).json({ success: true, data, message: 'Announcement created' });
  } catch (error) {
    next(error);
  }
}

export async function patchAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const announcementId = requireParam(req.params.announcementId, 'announcementId');
    const input = req.body as UpdateAnnouncementInput;
    const data = await updateAnnouncement(announcementId, input);
    res.status(200).json({ success: true, data, message: 'Announcement updated' });
  } catch (error) {
    next(error);
  }
}

export async function removeAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const announcementId = requireParam(req.params.announcementId, 'announcementId');
    await deleteAnnouncement(announcementId);
    res.status(200).json({ success: true, data: null, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
}

export async function postAnnouncementImage(
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
