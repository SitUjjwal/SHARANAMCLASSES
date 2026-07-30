/**
 * Application factory — middleware and route mounting only.
 * Business logic lives in services / repositories.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
    }),
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));

  app.use('/health', healthRouter);

  // Domain routes will be mounted here, e.g.:
  // app.use('/api/v1/auth', authRouter);
  // app.use('/api/v1/courses', coursesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
