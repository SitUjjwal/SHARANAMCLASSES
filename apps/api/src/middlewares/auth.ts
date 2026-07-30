/**
 * requireAuth — Express authentication middleware.
 *
 * What it does:
 * 1) Reads the Bearer token from `Authorization`
 * 2) Verifies it with Supabase Auth (`auth.getUser(jwt)`)
 * 3) Attaches `req.user` + `req.accessToken` when valid
 * 4) Rejects with 401 when missing/invalid/expired
 *
 * Why getUser(jwt) instead of only decoding locally?
 * - Supabase validates signature, expiry, and that the user still exists
 * - Safer than trusting a locally decoded payload alone
 *
 * Usage:
 *   router.get('/profile', requireAuth, getProfile)
 */
import type { NextFunction, Request, Response } from 'express';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { extractBearerToken } from '../utils/tokens';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken = extractBearerToken(req.headers.authorization);

    if (!accessToken) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Missing or invalid Authorization header. Expected: Bearer <access_token>',
      );
    }

    const supabase = getSupabaseAdmin();

    // Verifies the Supabase JWT and returns the Auth user
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
    }

    // Available to downstream controllers
    req.user = data.user;
    req.accessToken = accessToken;

    next();
  } catch (error) {
    next(error);
  }
}
