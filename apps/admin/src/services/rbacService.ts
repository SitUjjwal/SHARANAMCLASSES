/**
 * Admin RBAC API client.
 */
import { apiRequest } from '@/services/api';
import type { RbacPermission, RbacRole } from '@sharanam/shared';

export type RbacCatalog = {
  roles: Array<{ id: RbacRole; label: string; permissions: RbacPermission[] }>;
  modules: Array<{ id: string; label: string }>;
  matrix: Array<{
    module: string;
    action: string;
    permission: RbacPermission;
    roles: Record<RbacRole, boolean>;
  }>;
};

export type RbacStaffMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  rbac_role: RbacRole | null;
  updated_at: string | null;
};

export async function fetchRbacMatrix(): Promise<RbacCatalog> {
  return apiRequest<RbacCatalog>('/admin/rbac/matrix');
}

export async function fetchRbacStaff(): Promise<RbacStaffMember[]> {
  return apiRequest<RbacStaffMember[]>('/admin/rbac/staff');
}

export async function patchStaffRole(
  userId: string,
  role: RbacRole,
): Promise<RbacStaffMember> {
  return apiRequest<RbacStaffMember>(`/admin/rbac/staff/${userId}`, {
    method: 'PATCH',
    body: { role },
  });
}
