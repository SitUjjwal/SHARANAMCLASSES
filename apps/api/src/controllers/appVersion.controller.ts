/**
 * App version HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  checkClientAppVersion,
  getPublicReleaseNotes,
  getPublicVersionInfo,
  listAppVersionHistory,
  publishAppVersionRelease,
} from '../services/appVersion.service';
import { AppError } from '../utils/AppError';

function assertUser(req: Request): { id: string; email: string | null } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return { id: req.user.id, email: req.user.email ?? null };
}

/** GET /version — public live SemVer + build numbers + update flags */
export async function getVersionHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getPublicVersionInfo();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /release-notes?version=1.0.0 — public notes (+ recent history) */
export async function getReleaseNotesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const version = req.query.version ? String(req.query.version) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await getPublicReleaseNotes({ version, limit });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /public/version-check?client_version=1.0.0&platform=android */
export async function publicVersionCheckHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const client_version = String(req.query.client_version ?? req.query.version ?? '');
    const platform = req.query.platform ? String(req.query.platform) : undefined;
    const build_number = req.query.build_number ?? req.query.buildNumber ?? null;
    const data = await checkClientAppVersion({
      client_version,
      platform,
      build_number: build_number as string | number | null,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/app-versions */
export async function listAppVersionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUser(req);
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await listAppVersionHistory(limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/app-versions */
export async function publishAppVersionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = assertUser(req);
    const result = await publishAppVersionRelease({
      body: req.body,
      actor_id: user.id,
      actor_email: user.email,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
