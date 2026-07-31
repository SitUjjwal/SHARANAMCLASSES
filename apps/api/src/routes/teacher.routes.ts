/**
 * Teacher routes (admin assign-teacher dropdown).
 * GET /admin/teachers
 */
import { Router } from 'express';

import { listTeachersHandler } from '../controllers/teacher.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';

export const teacherRouter = Router();

teacherRouter.get('/admin/teachers', requireAuth, requireAdmin, listTeachersHandler);
