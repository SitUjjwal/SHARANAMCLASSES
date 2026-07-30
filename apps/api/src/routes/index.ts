import { Router } from 'express';

import { databaseRouter } from './database.routes';
import { healthRouter } from './health.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use(databaseRouter);

// Future domain mounts:
// routes.use('/api/v1/auth', authRouter);
// routes.use('/api/v1/courses', coursesRouter);
