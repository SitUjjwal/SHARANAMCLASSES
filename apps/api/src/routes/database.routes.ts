import { Router } from 'express';

import { getDatabaseStatus } from '../controllers/database.controller';

export const databaseRouter = Router();

databaseRouter.get('/database-status', getDatabaseStatus);
