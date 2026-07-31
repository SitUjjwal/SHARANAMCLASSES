/**
 * Chapter HTTP handlers — student nested routes + flat admin REST.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createChapter,
  createChapterContent,
  deleteChapter,
  deleteChapterContent,
  getChapterDetail,
  getCourseContent,
  listChapterContents,
  listChapterNotesForStudent,
  listChapterPdfsForStudent,
  listChaptersForAdmin,
  listChaptersForCourse,
  listChapterVideosForStudent,
  reorderChapters,
  updateChapter,
  updateChapterContent,
} from '../services/chapter.service';
import type {
  AdminListChaptersQuery,
  CreateChapterContentInput,
  CreateChapterInput,
  CreateChapterWithCourseInput,
  ReorderChaptersInput,
  UpdateChapterContentInput,
  UpdateChapterInput,
} from '../validators/course.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

function courseIdParam(req: Request): string {
  return requireParam(req.params.courseId ?? req.params.id, 'courseId');
}

function chapterIdParam(req: Request): string {
  return requireParam(req.params.chapterId ?? req.params.id, 'id');
}

/** GET /courses/:courseId/chapters — student published chapters */
export async function listChapters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = req.courseAccess?.courseId ?? courseIdParam(req);
    const data = await listChaptersForCourse(courseId, {
      publishedOnly: true,
      userId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /courses/:courseId/chapters/:chapterId — student chapter content */
export async function getChapter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const courseId = req.courseAccess?.courseId ?? courseIdParam(req);
    const chapterId = chapterIdParam(req);
    const data = await getChapterDetail(courseId, chapterId, userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /courses/:courseId/content — full course catalog (chapters + media + live) */
export async function getCourseContentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.courseAccess) {
      throw new AppError(
        500,
        'COURSE_ACCESS_MISSING',
        'Course access middleware required',
      );
    }
    const data = await getCourseContent(req.courseAccess.courseId, req.courseAccess);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /chapters/:chapterId/videos */
export async function listChapterVideos(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.courseAccess) {
      throw new AppError(
        500,
        'COURSE_ACCESS_MISSING',
        'Course access middleware required',
      );
    }
    const chapterId = chapterIdParam(req);
    const data = await listChapterVideosForStudent(chapterId, req.courseAccess);
    res.status(200).json({
      success: true,
      data,
      message:
        req.courseAccess.mode === 'full'
          ? 'Full access'
          : 'Preview access — free videos only unlocked',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /chapters/:chapterId/pdfs */
export async function listChapterPdfs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.courseAccess) {
      throw new AppError(
        500,
        'COURSE_ACCESS_MISSING',
        'Course access middleware required',
      );
    }
    const chapterId = chapterIdParam(req);
    const data = await listChapterPdfsForStudent(chapterId, req.courseAccess);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /chapters/:chapterId/notes */
export async function listChapterNotes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.courseAccess) {
      throw new AppError(
        500,
        'COURSE_ACCESS_MISSING',
        'Course access middleware required',
      );
    }
    const chapterId = chapterIdParam(req);
    const data = await listChapterNotesForStudent(chapterId, req.courseAccess);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chapters?courseId=&search=
 * Admin syllabus list (requires courseId).
 */
export async function listAdminChapters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as AdminListChaptersQuery;
    const courseId =
      query.courseId ??
      (typeof req.params.courseId === 'string' ? req.params.courseId : undefined);

    if (!courseId) {
      throw new AppError(400, 'COURSE_ID_REQUIRED', 'Query courseId is required');
    }

    const data = await listChaptersForAdmin(courseId, query.search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PUT /courses/:courseId/chapters/reorder (legacy nested) */
export async function putReorderChapters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    const body = req.body as ReorderChaptersInput;
    const data = await reorderChapters(courseId, body.orderedIds);
    res.status(200).json({ success: true, data, message: 'Chapter order saved' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /chapters/reorder — body { courseId, orderedIds }
 */
export async function putReorderChaptersFlat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as { courseId: string; orderedIds: string[] };
    const data = await reorderChapters(body.courseId, body.orderedIds);
    res.status(200).json({ success: true, data, message: 'Chapter order saved' });
  } catch (error) {
    next(error);
  }
}

/** POST /courses/:courseId/chapters — nested create */
export async function postChapter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const courseId = courseIdParam(req);
    const input = req.body as CreateChapterInput;
    const data = await createChapter(courseId, input);
    res.status(201).json({ success: true, data, message: 'Chapter created' });
  } catch (error) {
    next(error);
  }
}

/** POST /chapters — flat create with course_id in body */
export async function postChapterFlat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as CreateChapterWithCourseInput;
    const { course_id, ...input } = body;
    const data = await createChapter(course_id, input);
    res.status(201).json({ success: true, data, message: 'Chapter created' });
  } catch (error) {
    next(error);
  }
}

/** PUT|PATCH /chapters/:id */
export async function patchChapter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapterId = chapterIdParam(req);
    const input = req.body as UpdateChapterInput;
    const data = await updateChapter(chapterId, input);
    res.status(200).json({ success: true, data, message: 'Chapter updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /chapters/:id */
export async function removeChapter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapterId = chapterIdParam(req);
    await deleteChapter(chapterId);
    res.status(200).json({ success: true, data: null, message: 'Chapter deleted' });
  } catch (error) {
    next(error);
  }
}

/** GET /chapters/:id/contents — admin list videos/pdfs/notes */
export async function listContents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapterId = chapterIdParam(req);
    const data = await listChapterContents(chapterId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /chapters/:id/contents — add video / pdf / note */
export async function postContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapterId = chapterIdParam(req);
    const input = req.body as CreateChapterContentInput;
    const data = await createChapterContent(chapterId, input);
    res.status(201).json({ success: true, data, message: 'Content added' });
  } catch (error) {
    next(error);
  }
}

/** PUT /contents/:id */
export async function patchContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const contentId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateChapterContentInput;
    const data = await updateChapterContent(contentId, input);
    res.status(200).json({ success: true, data, message: 'Content updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /contents/:id */
export async function removeContent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const contentId = requireParam(req.params.id, 'id');
    await deleteChapterContent(contentId);
    res.status(200).json({ success: true, data: null, message: 'Content deleted' });
  } catch (error) {
    next(error);
  }
}
