/**
 * Staff role resolution + permission checks (RBAC).
 * ADMIN_EMAILS bootstrap promotes to super_admin.
 */
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isStaffProfileRole,
  permissionsForRole,
  resolveRbacRole,
  type AdminPermission,
  type RbacRole,
} from '@sharanam/shared';

import { env } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type StaffContext = {
  userId: string;
  email: string | null;
  profileRole: string;
  role: RbacRole;
  permissions: AdminPermission[];
};

function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Resolve staff RBAC context. Returns null for students / unknown roles.
 * Allowlisted emails without a staff role are promoted to super_admin once.
 */
export async function resolveStaffContext(
  userId: string,
  email?: string | null,
): Promise<StaffContext | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'PROFILE_LOOKUP_FAILED', error.message);
  }

  let profileRole = (data?.role as string | undefined) ?? null;
  const candidate = email ?? data?.email ?? null;

  let role = resolveRbacRole(profileRole);

  if (!role && isAllowlistedEmail(candidate)) {
    const now = new Date().toISOString();
    let promoted: 'super_admin' | 'admin' = 'super_admin';
    let { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin', updated_at: now })
      .eq('id', userId);

    // Migration not applied yet → fall back to legacy admin role
    if (promoteError) {
      const fallback = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: now })
        .eq('id', userId);
      promoteError = fallback.error;
      promoted = 'admin';
    }

    if (promoteError) {
      throw new AppError(500, 'ADMIN_PROMOTE_FAILED', promoteError.message);
    }

    profileRole = promoted;
    role = promoted === 'super_admin' ? 'super_admin' : 'admin';
  }

  if (!role || !profileRole || !isStaffProfileRole(profileRole)) {
    return null;
  }

  return {
    userId,
    email: candidate,
    profileRole,
    role,
    permissions: permissionsForRole(role),
  };
}

/** True when user is staff (any RBAC role). */
export async function isStaffUser(
  userId: string,
  email?: string | null,
): Promise<boolean> {
  const ctx = await resolveStaffContext(userId, email);
  return ctx !== null;
}

/**
 * Legacy helper: true for super_admin or admin (full ops admins).
 * Prefer hasStaffPermission for module gates.
 */
export async function isAdminUser(
  userId: string,
  email?: string | null,
): Promise<boolean> {
  const ctx = await resolveStaffContext(userId, email);
  return ctx?.role === 'super_admin' || ctx?.role === 'admin';
}

export async function hasStaffPermission(
  userId: string,
  permission: AdminPermission,
  email?: string | null,
): Promise<boolean> {
  const ctx = await resolveStaffContext(userId, email);
  return hasPermission(ctx?.role, permission);
}

export async function assertStaffPermission(
  userId: string,
  permission: AdminPermission | AdminPermission[],
  email?: string | null,
  mode: 'any' | 'all' = 'any',
): Promise<StaffContext> {
  const ctx = await resolveStaffContext(userId, email);
  if (!ctx) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Staff access required. Set profiles.role to super_admin, admin, teacher, or support (or add your email to ADMIN_EMAILS).',
    );
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const ok =
    mode === 'all'
      ? hasAllPermissions(ctx.role, required)
      : hasAnyPermission(ctx.role, required);

  if (!ok) {
    throw new AppError(
      403,
      'FORBIDDEN',
      `Missing permission: ${required.join(' | ')} (role=${ctx.role})`,
    );
  }

  return ctx;
}
