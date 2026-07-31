import { Router } from 'express';

import { bannerRouter } from './banner.routes';
import { categoryRouter } from './category.routes';
import { courseRouter } from './course.routes';
import { dashboardRouter } from './dashboard.routes';
import { databaseRouter } from './database.routes';
import { healthRouter } from './health.routes';
import { profileRouter } from './profile.routes';
import { teacherRouter } from './teacher.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use(databaseRouter);
routes.use(profileRouter);
routes.use(dashboardRouter);
routes.use(courseRouter);
routes.use(bannerRouter);
routes.use(categoryRouter);
routes.use(teacherRouter);
