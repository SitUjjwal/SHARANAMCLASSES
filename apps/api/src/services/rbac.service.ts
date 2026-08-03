/**
 * RBAC admin APIs — matrix, my permissions, assign staff roles.
 */
import {
  buildPermissionMatrixTable,
  permissionsForRole,
  RBAC_MODULE_LABELS,
  RBAC_MODULES,
  RBAC_ROLE_LABELS,
  RBAC_ROLES,
  resolveRbacRole,
  type RbacRole,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { writeActivityLog } from './activityLog.service';
import { AppError } from '../utils/AppError';

export type StaffMemberRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  rbac_role: RbacRole | null;
  updated_at: string | null;
};

export function getRbacCatalog() {
  return {
    roles: RBAC_ROLES.map((role) => ({
      id: role,
      label: RBAC_ROLE_LABELS[role],
      permissions: permissionsForRole(role),
    })),
    modules: RBAC_MODULES.map((module) => ({
      id: module,
      label: RBAC_MODULE_LABELS[module],
    })),
    matrix: buildPermissionMatrixTable(),
  };
}

export async function listStaffMembers(): Promise<StaffMemberRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, updated_at')
    .in('role', ['super_admin', 'admin', 'teacher', 'instructor', 'support'])
    .order('role', { ascending: true })
    .order('email', { ascending: true });

  if (error) {
    throw new AppError(500, 'STAFF_LIST_FAILED', error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    full_name: (row.full_name as string | null) ?? null,
    role: row.role as string,
    rbac_role: resolveRbacRole(row.role as string),
    updated_at: (row.updated_at as string | null) ?? null,
  }));
}

export async function updateStaffRole(input: {
  actorId: string;
  actorEmail: string | null;
  actorRole: RbacRole;
  targetUserId: string;
  nextRole: RbacRole;
}): Promise<StaffMemberRow> {
  if (input.actorRole !== 'super_admin') {
    throw new AppError(403, 'FORBIDDEN', 'Only Super Admin can assign roles');
  }

  if (input.targetUserId === input.actorId && input.nextRole !== 'super_admin') {
    throw new AppError(
      400,
      'CANNOT_DEMOTE_SELF',
      'Super Admin cannot demote their own account',
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, updated_at')
    .eq('id', input.targetUserId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'PROFILE_LOOKUP_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Profile not found');
  }

  // Persist teacher as `teacher` (preferred); keep instructor readable via resolveRbacRole
  const profileRole = input.nextRole === 'teacher' ? 'teacher' : input.nextRole;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: profileRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.targetUserId)
    .select('id, email, full_name, role, updated_at')
    .single();

  if (error) {
    throw new AppError(500, 'ROLE_UPDATE_FAILED', error.message);
  }

  await writeActivityLog({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    action: 'roles.update',
    entity_type: 'profile',
    entity_id: input.targetUserId,
    summary: `Changed role ${existing.role} → ${profileRole} for ${data.email ?? input.targetUserId}`,
    metadata: {
      previous_role: existing.role,
      next_role: profileRole,
    },
  });

  return {
    id: data.id as string,
    email: (data.email as string | null) ?? null,
    full_name: (data.full_name as string | null) ?? null,
    role: data.role as string,
    rbac_role: resolveRbacRole(data.role as string),
    updated_at: (data.updated_at as string | null) ?? null,
  };
}
