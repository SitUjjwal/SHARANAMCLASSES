/**
 * Helmet + custom HTTP security headers for JSON APIs.
 */
import type { RequestHandler } from 'express';
import helmet from 'helmet';

import { env } from '../config/env';

const isProd = env.NODE_ENV === 'production';

/** Secure headers (CSP relaxed for JSON API; HSTS only in production). */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Not an HTML server — avoid breaking JSON clients
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: isProd
    ? {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
});

/** Extra headers Helmet does not set by default for APIs. */
export const extraSecureHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Modern browsers; rely on CSP/no HTML
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  // Default no-store; apiCacheMiddleware / handlers may override per-route
  if (isProd && !res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
};
