/**
 * analytics.routes.ts
 *
 *   GET /student/analytics — Test Series analytics dashboard
 */
import { Router } from 'express';

import { getAnalytics } from '../controllers/analytics.controller';
import { requireAuth } from '../middlewares/auth';

export const analyticsRouter = Router();

analyticsRouter.get('/student/analytics', requireAuth, getAnalytics);
