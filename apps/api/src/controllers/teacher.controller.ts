/**
 * Teacher HTTP handlers (admin).
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createTeacher,
  listTeachers,
  removeTeacher,
  updateTeacher,
} from '../services/teacher.service';
import { requireParam } from '../utils/params';
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
} from '../validators/teacher.validators';

export async function listTeachersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listTeachers();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function postTeacherHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateTeacherInput;
    const data = await createTeacher(input);
    res.status(201).json({ success: true, data, message: 'Teacher created' });
  } catch (error) {
    next(error);
  }
}

export async function patchTeacherHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = requireParam(req.params.teacherId, 'teacherId');
    const input = req.body as UpdateTeacherInput;
    const data = await updateTeacher(teacherId, input);
    res.status(200).json({ success: true, data, message: 'Teacher updated' });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacherHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = requireParam(req.params.teacherId, 'teacherId');
    await removeTeacher(teacherId);
    res.status(200).json({ success: true, data: null, message: 'Teacher removed' });
  } catch (error) {
    next(error);
  }
}
