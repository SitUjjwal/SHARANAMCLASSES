/**
 * Subjects + batch-subjects HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  addSubjectsToBatch,
  createSubject,
  deleteSubject,
  getBatchSubject,
  listBatchSubjects,
  listStudentBatchSubjects,
  listSubjects,
  removeSubjectFromBatch,
  reorderBatchSubjects,
  updateBatchSubject,
  updateSubject,
} from '../services/subject.service';
import {
  createChapter,
  listChaptersForAdmin,
  listChaptersForCourse,
} from '../services/chapter.service';
import type {
  AddBatchSubjectsInput,
  CreateSubjectInput,
  ListSubjectsQuery,
  ReorderBatchSubjectsInput,
  UpdateBatchSubjectInput,
  UpdateSubjectInput,
} from '../validators/subject.validators';
import type { CreateChapterInput } from '../validators/course.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated user missing on request');
  }
  return req.user.id;
}

// ---- Subjects master catalog ----

export async function getSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ListSubjectsQuery;
    const data = await listSubjects(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function postSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await createSubject(req.body as CreateSubjectInput);
    res.status(201).json({ success: true, data, message: 'Subject created' });
  } catch (error) {
    next(error);
  }
}

export async function patchSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    const data = await updateSubject(id, req.body as UpdateSubjectInput);
    res.status(200).json({ success: true, data, message: 'Subject updated' });
  } catch (error) {
    next(error);
  }
}

export async function removeSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    await deleteSubject(id);
    res.status(200).json({ success: true, data: null, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
}

// ---- Batch subjects ----

export async function getBatchSubjectList(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = requireParam(req.params.id, 'id');
    const data = await listBatchSubjects(batchId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function postBatchSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = requireParam(req.params.id, 'id');
    const data = await addSubjectsToBatch(batchId, req.body as AddBatchSubjectsInput);
    res.status(201).json({ success: true, data, message: 'Subjects added to batch' });
  } catch (error) {
    next(error);
  }
}

export async function deleteBatchSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = requireParam(req.params.id, 'id');
    const subjectId = requireParam(req.params.subjectId, 'subjectId');
    await removeSubjectFromBatch(batchId, subjectId);
    res.status(200).json({ success: true, data: null, message: 'Subject removed from batch' });
  } catch (error) {
    next(error);
  }
}

export async function putReorderBatchSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = requireParam(req.params.id, 'id');
    const body = req.body as ReorderBatchSubjectsInput;
    const data = await reorderBatchSubjects(batchId, body.orderedIds);
    res.status(200).json({ success: true, data, message: 'Subject order saved' });
  } catch (error) {
    next(error);
  }
}

export async function patchBatchSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    const data = await updateBatchSubject(id, req.body as UpdateBatchSubjectInput);
    res.status(200).json({ success: true, data, message: 'Batch subject updated' });
  } catch (error) {
    next(error);
  }
}

export async function getBatchSubjectDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    const data = await getBatchSubject(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// ---- Chapters inside a batch subject ----

/** GET /batch-subjects/:id/chapters — admin full list */
export async function getBatchSubjectChapters(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    const bs = await getBatchSubject(id);
    const data = await listChaptersForAdmin(bs.batch_id, undefined, id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /batch-subjects/:id/chapters — create chapter under subject */
export async function postBatchSubjectChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, 'id');
    const bs = await getBatchSubject(id);
    const input = { ...(req.body as CreateChapterInput), batch_subject_id: id };
    const data = await createChapter(bs.batch_id, input);
    res.status(201).json({ success: true, data, message: 'Chapter created' });
  } catch (error) {
    next(error);
  }
}

// ---- Student views ----

/** GET /student/batches/:id/subjects — active subjects with progress */
export async function getStudentBatchSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = requireParam(req.params.id, 'id');
    const userId = assertUserId(req);
    const data = await listStudentBatchSubjects(batchId, userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /student/batch-subjects/:id/chapters — published chapters with lock state */
export async function getStudentBatchSubjectChapters(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = requireParam(req.params.id, 'id');
    const userId = assertUserId(req);
    const bs = await getBatchSubject(id);
    const data = await listChaptersForCourse(bs.batch_id, {
      publishedOnly: true,
      userId,
      batchSubjectId: id,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
