import { Router } from 'express';

import { databaseRouter } from './database.routes';
import { healthRouter } from './health.routes';
import { profileRouter } from './profile.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use(databaseRouter);
routes.use(profileRouter);

// Future domain mounts:
// routes.use('/api/v1/courses', coursesRouter);
