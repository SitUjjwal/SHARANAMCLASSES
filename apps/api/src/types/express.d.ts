/**
 * Express Request augmentation for authenticated routes.
 * After `requireAuth`, handlers can read `req.user` and `req.accessToken`.
 */
import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}

export {};
