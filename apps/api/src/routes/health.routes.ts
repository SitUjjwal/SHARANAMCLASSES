import { Router } from 'express';

import { getHealth, getReady } from '../controllers/health.controller';

export const healthRouter = Router();

/** GET /health — liveness */
healthRouter.get('/', getHealth);

/** Mounted at /ready on the root router (see routes/index.ts). */
export const readyRouter = Router();
readyRouter.get('/', getReady);
