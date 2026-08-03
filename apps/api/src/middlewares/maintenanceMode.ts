/**
 * When maintenance_mode is on, block non-staff API traffic with 503.
 * Always allows: /health, /public/*, OPTIONS.
 * Staff (super_admin/admin/teacher/support) may still operate the portal.
 */
import type { NextFunction, Request, Response } from 'express';

import { resolveStaffContext } from '../services/role.service';
import { isMaintenanceModeEnabled } from '../services/systemSettings.service';
import { AppError } from '../utils/AppError';

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export async function maintenanceModeGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const path = req.path || '';
    if (
      path === '/health' ||
      path.startsWith('/health/') ||
      path === '/system-status' ||
      path === '/public/platform' ||
      path.startsWith('/public/')
    ) {
      next();
      return;
    }

    const enabled = await isMaintenanceModeEnabled();
    if (!enabled) {
      next();
      return;
    }

    // Maintenance on — allow authenticated staff only
    const token = extractBearer(req);
    if (token && req.user?.id) {
      const staff = await resolveStaffContext(req.user.id, req.user.email);
      if (staff) {
        next();
        return;
      }
    }

    // req.user may not be set yet (this runs before route-level requireAuth).
    // Soft-check via Authorization is handled only when requireAuth already ran.
    // For early global guard: try supabase user resolution only if token present.
    if (token && !req.user?.id) {
      // Lazy import to avoid circular deps at module load
      const { getSupabaseAdmin } = await import('../config/supabase');
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.auth.getUser(token);
      if (data.user?.id) {
        const staff = await resolveStaffContext(data.user.id, data.user.email);
        if (staff) {
          next();
          return;
        }
      }
    }

    throw new AppError(
      503,
      'MAINTENANCE',
      'SHARANAM CLASSES is under maintenance. Please try again shortly.',
    );
  } catch (error) {
    next(error);
  }
}
