import { Router } from 'express';

import { adminInsightsRouter } from './adminInsights.routes';
import { analyticsRouter } from './analytics.routes';
import { attemptRouter } from './attempt.routes';
import { bannerRouter } from './banner.routes';
import { categoryRouter } from './category.routes';
import { courseRouter } from './course.routes';
import { dashboardRouter } from './dashboard.routes';
import { databaseRouter } from './database.routes';
import { healthRouter } from './health.routes';
import { leaderboardRouter } from './leaderboard.routes';
import { liveClassRouter } from './liveClass.routes';
import { myCourseRouter } from './myCourse.routes';
import { noteRouter } from './note.routes';
import { paymentRouter } from './payment.routes';
import { pdfRouter } from './pdf.routes';
import { profileRouter } from './profile.routes';
import { questionRouter } from './question.routes';
import { teacherRouter } from './teacher.routes';
import { testRouter } from './test.routes';
import { videoRouter } from './video.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use(databaseRouter);
routes.use(profileRouter);
routes.use(dashboardRouter);
routes.use(courseRouter);
routes.use(myCourseRouter);
routes.use(videoRouter);
routes.use(pdfRouter);
routes.use(noteRouter);
routes.use(liveClassRouter);
routes.use(testRouter);
routes.use(questionRouter);
routes.use(attemptRouter);
routes.use(leaderboardRouter);
routes.use(analyticsRouter);
routes.use(adminInsightsRouter);
routes.use(paymentRouter);
routes.use(bannerRouter);
routes.use(categoryRouter);
routes.use(teacherRouter);

