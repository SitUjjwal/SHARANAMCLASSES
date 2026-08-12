/**
 * Rate limiting — global + auth-sensitive routes.
 * Relies on `trust proxy` when behind nginx / load balancer.
 */
import rateLimit from 'express-rate-limit';

import { env } from '../config/env';

const isDev = env.NODE_ENV === 'development';

/** Global API abuse protection */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: isDev ? Math.max(env.RATE_LIMIT_MAX, 2000) : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === '/health' ||
    req.path.startsWith('/health/') ||
    req.path === '/ready' ||
    req.path.startsWith('/ready/') ||
    req.path === '/version' ||
    req.path === '/release-notes' ||
    req.path === '/system-status',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

/** Stricter limit for auth bootstrap / token-heavy endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});
