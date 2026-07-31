/**
 * Teacher HTTP handlers (admin).
 */
import type { NextFunction, Request, Response } from 'express';

import { listTeachers } from '../services/teacher.service';

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
