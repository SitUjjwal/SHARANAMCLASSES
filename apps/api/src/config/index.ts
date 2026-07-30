/**
 * Centralized application configuration.
 * Extend as integrations are wired.
 */
import { env } from './env';

export const config = {
  app: {
    name: 'SHARANAM CLASSES API',
    env: env.NODE_ENV,
    port: env.PORT,
    baseUrl: env.API_BASE_URL,
  },
  cors: {
    origins: env.CORS_ORIGINS,
  },
} as const;
