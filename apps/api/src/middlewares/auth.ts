/**
 * requireAuth — verifies Supabase access JWT (signature, expiry, user existence).
 *
 * Security notes:
 * - Does NOT trust locally decoded payloads alone
 * - Rejects malformed / oversized tokens before calling Supabase
 * - Uses service-role client only for auth.getUser(jwt)
 */
import type { NextFunction, Request, Response } from 'express';

import { getSupabaseAdmin } from '../config/supabase';
import { logger } from '../logging';
import { AppError } from '../utils/AppError';
import { extractBearerToken } from '../utils/tokens';

const JWT_PARTS = 3;
const MAX_TOKEN_CHARS = 4096;

function assertJwtShape(token: string): void {
  if (token.length > MAX_TOKEN_CHARS) {
    throw new AppError(401, 'UNAUTHORIZED', 'Access token is too large');
  }
  const parts = token.split('.');
  if (parts.length !== JWT_PARTS || parts.some((p) => !p)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Malformed access token');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(parts[0]!) || !/^[A-Za-z0-9_-]+$/.test(parts[1]!)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Malformed access token');
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken = extractBearerToken(req.headers.authorization);

    if (!accessToken) {
      logger.auth(
        'Missing Authorization bearer token',
        { request_id: req.requestId, path: req.path, ip: req.ip },
        'warn',
      );
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Missing or invalid Authorization header. Expected: Bearer <access_token>',
      );
    }

    assertJwtShape(accessToken);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      logger.auth(
        'Invalid or expired access token',
        {
          request_id: req.requestId,
          path: req.path,
          ip: req.ip,
          supabase_error: error?.message,
        },
        'warn',
      );
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
    }

    if (data.user.banned_until) {
      const bannedUntil = new Date(data.user.banned_until).getTime();
      if (!Number.isNaN(bannedUntil) && bannedUntil > Date.now()) {
        logger.auth(
          'Suspended account rejected',
          {
            request_id: req.requestId,
            user_id: data.user.id,
            email: data.user.email,
            banned_until: data.user.banned_until,
          },
          'warn',
        );
        throw new AppError(403, 'FORBIDDEN', 'Account is suspended');
      }
    }

    req.user = data.user;
    req.accessToken = accessToken;

    next();
  } catch (error) {
    next(error);
  }
}
