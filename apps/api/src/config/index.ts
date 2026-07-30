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
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  supabase: {
    url: env.SUPABASE_URL,
  },
} as const;
