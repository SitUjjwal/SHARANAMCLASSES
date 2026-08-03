/**
 * Teacher HTTP handlers (admin).
 */
import type { NextFunction, Request, Response } from 'express';

import {
  assignTeacherCourses,
  assignTeacherLiveClasses,
  createTeacher,
  getTeacherDetail,
  getTeacherStats,
  listAssignableCourses,
  listAssignableLiveClasses,
  listTeacherCourses,
  listTeacherLiveClasses,
  listTeachers,
  removeTeacher,
  updateTeacher,
} from '../services/teacher.service';
import { requireParam } from '../utils/params';
import { AppError } from '../utils/AppError';
import type {
  AssignCoursesInput,
  AssignLiveClassesInput,
  CreateTeacherInput,
  UpdateTeacherInput,
} from '../validators/teacher.validators';

function teacherIdParam(req: Request): string {
  return requireParam(req.params.id ?? req.params.teacherId, 'id');
}

function actor(req: Request): { id: string; email: string | null } {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return { id: req.user.id, email: req.user.email ?? null };
}

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

export async function getTeacherHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await getTeacherDetail(teacherId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await getTeacherStats(teacherId);
    res.status(200).json({ success: true, data });
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
    const teacherId = teacherIdParam(req);
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
    const teacherId = teacherIdParam(req);
    await removeTeacher(teacherId);
    res.status(200).json({ success: true, data: null, message: 'Teacher removed' });
  } catch (error) {
    next(error);
  }
}

export async function listTeacherCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await listTeacherCourses(teacherId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listAssignableCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await listAssignableCourses(teacherId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function putTeacherCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const a = actor(req);
    const teacherId = teacherIdParam(req);
    const input = req.body as AssignCoursesInput;
    const data = await assignTeacherCourses(teacherId, input.course_ids, a);
    res.status(200).json({ success: true, data, message: 'Courses assigned' });
  } catch (error) {
    next(error);
  }
}

export async function listTeacherLiveClassesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await listTeacherLiveClasses(teacherId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listAssignableLiveClassesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId = teacherIdParam(req);
    const data = await listAssignableLiveClasses(teacherId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function putTeacherLiveClassesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const a = actor(req);
    const teacherId = teacherIdParam(req);
    const input = req.body as AssignLiveClassesInput;
    const data = await assignTeacherLiveClasses(teacherId, input.live_class_ids, a);
    res.status(200).json({ success: true, data, message: 'Live classes assigned' });
  } catch (error) {
    next(error);
  }
}
