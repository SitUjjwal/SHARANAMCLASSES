/**
 * Dashboard routes.
 * GET /dashboard — authenticated home aggregate.
 */
import { Router } from 'express';

import { getDashboard } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', requireAuth, getDashboard);
