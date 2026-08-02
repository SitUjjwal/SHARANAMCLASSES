/**
 * Profile extras:
 *   GET /progress            (canonical)
 *   GET /learning-progress   (alias)
 *   GET /achievements
 *
 * Certificates: certificate.routes.ts
 * Test history: attempt.routes.ts → GET /test-history
 */
import { Router } from 'express';

import {
  getLearningProgress,
  listAchievements,
} from '../controllers/studentProfileExtras.controller';
import { requireAuth } from '../middlewares/auth';

export const profileExtrasRouter = Router();

profileExtrasRouter.get('/achievements', requireAuth, listAchievements);
profileExtrasRouter.get('/progress', requireAuth, getLearningProgress);
profileExtrasRouter.get('/learning-progress', requireAuth, getLearningProgress);
