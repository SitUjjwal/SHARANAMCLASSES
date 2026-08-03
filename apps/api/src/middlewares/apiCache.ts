/**
 * Lightweight in-memory GET response cache + Cache-Control headers.
 *
 * - Only caches successful JSON GETs for allowlisted public/catalog paths
 * - Skips Authorization-bearing requests for shared public keys (user-specific
 *   catalog uses private short Cache-Control without storing body)
 * - Not a Redis replacement — process-local TTL map with max entries
 */
import type { NextFunction, Request, Response } from 'express';

type CacheEntry = {
  expiresAt: number;
  status: number;
  body: unknown;
  contentType: string;
};

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 200;

/** Path prefixes eligible for shared (anonymous) body cache */
const PUBLIC_CACHE_RULES: { prefix: string; ttlSeconds: number }[] = [
  { prefix: '/public/platform', ttlSeconds: 30 },
  { prefix: '/health', ttlSeconds: 5 },
];

/** Authenticated catalog — HTTP cache hints only (no shared body cache) */
const PRIVATE_CACHE_RULES: { prefix: string; ttlSeconds: number }[] = [
  { prefix: '/courses', ttlSeconds: 30 },
  { prefix: '/categories', ttlSeconds: 60 },
  { prefix: '/live-classes', ttlSeconds: 15 },
  { prefix: '/live-classes/public', ttlSeconds: 15 },
  { prefix: '/student/tests', ttlSeconds: 30 },
  { prefix: '/banners', ttlSeconds: 60 },
  { prefix: '/faqs', ttlSeconds: 60 },
];

function matchRule(
  path: string,
  rules: { prefix: string; ttlSeconds: number }[],
): number | null {
  for (const rule of rules) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}?`) || path.startsWith(`${rule.prefix}/`)) {
      // Prefer longer prefixes — rules are ordered specific-first where needed
      return rule.ttlSeconds;
    }
  }
  return null;
}

function cacheKey(req: Request): string {
  return `${req.method}:${req.originalUrl}`;
}

function evictIfNeeded(): void {
  if (store.size <= MAX_ENTRIES) return;
  const first = store.keys().next().value;
  if (first) store.delete(first);
}

export function invalidateApiCache(prefix = ''): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.includes(prefix)) store.delete(key);
  }
}

export const apiCacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method !== 'GET') {
    next();
    return;
  }

  const path = req.path;
  const publicTtl = matchRule(path, PUBLIC_CACHE_RULES);
  const privateTtl = matchRule(path, PRIVATE_CACHE_RULES);
  const hasAuth = Boolean(req.headers.authorization);

  if (publicTtl && !hasAuth) {
    const key = cacheKey(req);
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      res.setHeader('Cache-Control', `public, max-age=${publicTtl}`);
      res.setHeader('X-Cache', 'HIT');
      res.status(hit.status).type(hit.contentType).json(hit.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        evictIfNeeded();
        store.set(key, {
          expiresAt: Date.now() + publicTtl * 1000,
          status: res.statusCode,
          body,
          contentType: 'application/json',
        });
        res.setHeader('Cache-Control', `public, max-age=${publicTtl}`);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    }) as Response['json'];

    next();
    return;
  }

  if (privateTtl && hasAuth) {
    // Do not let browsers keep stale admin/catalog lists after create/update/delete.
    res.setHeader('Cache-Control', 'private, no-store');
    next();
    return;
  }

  next();
};
