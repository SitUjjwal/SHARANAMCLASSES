/**
 * Admin students HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getAdminStudent,
  listAdminStudents,
  updateAdminStudent,
} from '../services/studentAdmin.service';
import { requireParam } from '../utils/params';
import { AppError } from '../utils/AppError';
import type {
  ListStudentsQuery,
  UpdateStudentInput,
} from '../validators/studentAdmin.validators';

function assertAdmin(req: Request): void {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
}

/** GET /admin/students */
export async function listStudentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertAdmin(req);
    const query = req.query as unknown as ListStudentsQuery;
    const data = await listAdminStudents(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/students/:studentId */
export async function getStudentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertAdmin(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const data = await getAdminStudent(studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/students/:studentId */
export async function patchStudentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertAdmin(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const input = req.body as UpdateStudentInput;
    const data = await updateAdminStudent(studentId, input);
    res.status(200).json({
      success: true,
      data,
      message: 'Student updated',
    });
  } catch (error) {
    next(error);
  }
}
