/**
 * question.controller.ts — Question Management HTTP adapters.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  bulkImportQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionForAdmin,
  listQuestionsForAdmin,
  listQuestionsPublic,
  parseQuestionsExcel,
  updateQuestion,
} from '../services/question.service';
import type {
  CreateQuestionBody,
  ListQuestionsQuery,
  UpdateQuestionInput,
} from '../validators/question.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

/** GET /tests/:testId/questions */
export async function listQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.testId, 'testId');
    const query = {
      ...(req.query as object),
      testId,
    } as ListQuestionsQuery;
    const data = await listQuestionsForAdmin(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /questions/:id */
export async function getQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const questionId = requireParam(req.params.id, 'id');
    const data = await getQuestionForAdmin(questionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /tests/:testId/questions */
export async function postQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.testId, 'testId');
    const body = req.body as CreateQuestionBody;
    const data = await createQuestion({ ...body, test_id: testId });
    res.status(201).json({ success: true, data, message: 'Question created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /questions/:id */
export async function putQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const questionId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateQuestionInput;
    const data = await updateQuestion(questionId, input);
    res.status(200).json({ success: true, data, message: 'Question updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /questions/:id */
export async function removeQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const questionId = requireParam(req.params.id, 'id');
    await deleteQuestion(questionId);
    res.status(200).json({ success: true, data: null, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /tests/:testId/questions/import — multipart field `file` */
export async function postQuestionsImport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.testId, 'testId');
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new AppError(400, 'EXCEL_REQUIRED', 'Upload an Excel file in field "file"');
    }

    const rows = await parseQuestionsExcel(file.buffer);
    if (rows.length === 0) {
      throw new AppError(400, 'EXCEL_NO_ROWS', 'Excel has no data rows');
    }
    if (rows.length > 500) {
      throw new AppError(400, 'EXCEL_TOO_LARGE', 'Import at most 500 questions per file');
    }

    const data = await bulkImportQuestions(testId, rows);
    res.status(200).json({
      success: true,
      data,
      message: `Imported ${data.imported} question(s), skipped ${data.skipped}`,
    });
  } catch (error) {
    next(error);
  }
}

/** GET /student/tests/:testId/questions — no answers */
export async function listStudentQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const testId = requireParam(req.params.testId, 'testId');
    const items = await listQuestionsPublic(testId);
    res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}
