/**
 * Admin students HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  activateAdminStudent,
  exportAdminStudentsExcel,
  getAdminStudent,
  listAdminStudentCourses,
  listAdminStudentPayments,
  listAdminStudents,
  listAdminStudentTestHistory,
  resetAdminStudentPassword,
  suspendAdminStudent,
  updateAdminStudent,
} from '../services/studentAdmin.service';
import { requireParam } from '../utils/params';
import { AppError } from '../utils/AppError';
import type {
  ListStudentsQuery,
  ResetStudentPasswordInput,
  SuspendStudentInput,
  UpdateStudentInput,
} from '../validators/studentAdmin.validators';

function assertActor(req: Request): { id: string; email: string | null } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return {
    id: req.user.id,
    email: req.user.email ?? null,
  };
}

/** GET /admin/students */
export async function listStudentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertActor(req);
    const query = req.query as unknown as ListStudentsQuery;
    const data = await listAdminStudents(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/students/export */
export async function exportStudentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertActor(req);
    const query = req.query as unknown as ListStudentsQuery;
    const data = await exportAdminStudentsExcel(query);
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
    assertActor(req);
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
    const actor = assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const input = req.body as UpdateStudentInput;
    const data = await updateAdminStudent(studentId, input, actor);
    res.status(200).json({
      success: true,
      data,
      message: 'Student updated',
    });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/students/:studentId/suspend */
export async function suspendStudentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const input = (req.body ?? {}) as SuspendStudentInput;
    const data = await suspendAdminStudent(studentId, input, actor);
    res.status(200).json({ success: true, data, message: 'Student suspended' });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/students/:studentId/activate */
export async function activateStudentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const data = await activateAdminStudent(studentId, actor);
    res.status(200).json({ success: true, data, message: 'Student activated' });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/students/:studentId/reset-password */
export async function resetStudentPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const input = (req.body ?? {}) as ResetStudentPasswordInput;
    const data = await resetAdminStudentPassword(studentId, input, actor);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/students/:studentId/courses */
export async function listStudentCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const data = await listAdminStudentCourses(studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/students/:studentId/tests */
export async function listStudentTestsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const data = await listAdminStudentTestHistory(studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/students/:studentId/payments */
export async function listStudentPaymentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertActor(req);
    const studentId = requireParam(req.params.studentId, 'studentId');
    const data = await listAdminStudentPayments(studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
