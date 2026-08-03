/**
 * CORS whitelist — only configured origins (plus no-Origin for native apps).
 * In development, any http(s)://localhost / 127.0.0.1 port is allowed
 * (Vite often hops 5173 → 5174 when the default port is busy).
 */
import cors from 'cors';
import type { CorsOptions } from 'cors';

import { env } from '../config/env';

const allowlist = new Set(env.CORS_ORIGINS);

function isDevLocalhost(origin: string): boolean {
  if (env.NODE_ENV === 'production') return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Mobile / server-to-server often omit Origin
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowlist.has(origin) || isDevLocalhost(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS_FORBIDDEN:${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining'],
  maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);
