/**
 * Express application factory.
 * Why: keep middleware/route wiring separate from process boot (`server.ts`).
 * Future: mount versioned domain routers under `/api/v1/*` here via `routes`.
 */
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { routes } from './routes';

export function createApp() {
  const app = express();

  // Hide Express fingerprint
  app.disable('x-powered-by');

  // Security + performance + cross-origin access for mobile/admin
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  // Request logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Body + cookie parsers (JSON APIs + future cookie sessions)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Basic abuse protection (skipped entirely in development)
  if (env.NODE_ENV !== 'development') {
    app.use(rateLimiter);
  }

  // Domain routes (/health, /database-status, later /api/v1/...)
  app.use(routes);

  // 404 then centralized error JSON
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
