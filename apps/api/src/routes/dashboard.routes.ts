/**
 * Dashboard routes.
 * GET /dashboard — staff admin overview OR student home (role-aware).
 */
import { Router } from 'express';

import { getDashboard } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', requireAuth, getDashboard);
