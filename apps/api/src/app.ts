/**
 * Express application factory — production-ready security middleware stack.
 *
 * Order matters:
 * 1. trust proxy / fingerprint
 * 2. request id
 * 3. secure headers (Helmet + extras)
 * 4. HTTPS enforcement (prod)
 * 5. compression
 * 6. CORS whitelist
 * 7. body parsers (size limits)
 * 8. XSS sanitize on JSON body
 * 9. rate limit
 * 10. API request logging
 * 11. maintenance
 * 12. routes
 * 13. 404 + consistent error JSON
 */
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';

import { corsMiddleware } from './middlewares/cors';
import { enforceHttps } from './middlewares/enforceHttps';
import { errorHandler } from './middlewares/errorHandler';
import { maintenanceModeGuard } from './middlewares/maintenanceMode';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { requestId } from './middlewares/requestId';
import { sanitizeRequestBody } from './middlewares/sanitizeBody';
import { apiCacheMiddleware } from './middlewares/apiCache';
import { extraSecureHeaders, helmetMiddleware } from './middlewares/secureHeaders';
import { requestLogger } from './logging';
import { routes } from './routes';

export function createApp() {
  const app = express();

  // Correct client IP / proto behind nginx, Cloudflare, etc. (needed for rate limits + HTTPS)
  app.set('trust proxy', 1);

  // Hide Express fingerprint
  app.disable('x-powered-by');

  // Correlation id for logs and client debugging
  app.use(requestId);

  // Secure HTTP headers
  app.use(helmetMiddleware);
  app.use(extraSecureHeaders);

  // Reject cleartext when production expects TLS at the edge
  app.use(enforceHttps);

  // Gzip / brotli-capable compression (skip already-compressed)
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // CORS whitelist only
  app.use(corsMiddleware);

  // Structured API request logs (file + rotation) — replaces morgan stdout-only
  app.use(requestLogger);

  // Request size limits — JSON APIs stay small; uploads use multer separately
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(
    express.urlencoded({
      extended: false, // qs prototype-pollution safer defaults
      limit: '100kb',
      parameterLimit: 50,
    }),
  );
  app.use(cookieParser());

  // Strip HTML / javascript: from string fields before validators
  app.use(sanitizeRequestBody);

  // Global rate limit (health skipped inside limiter)
  app.use(rateLimiter);

  // Short TTL response cache + Cache-Control for catalog/public GETs
  app.use(apiCacheMiddleware);

  // Platform maintenance gate
  app.use(maintenanceModeGuard);

  // Domain routes
  app.use(routes);

  // Consistent 404 + error envelope
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
