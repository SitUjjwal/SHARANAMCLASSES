/**
 * Admin UI permission helpers — delegates to shared RBAC matrix.
 */
import {
  hasPermission,
  permissionsForRole,
  resolveRbacRole,
  RBAC_ROLE_LABELS,
  type AdminPermission,
  type RbacRole,
} from '@sharanam/shared';

export type { AdminPermission, RbacRole };

export function resolveUiRole(
  profileRole: string | null | undefined,
): RbacRole | null {
  return resolveRbacRole(profileRole);
}

export function roleLabel(role: RbacRole | null | undefined): string {
  if (!role) return 'No access';
  return RBAC_ROLE_LABELS[role];
}

export function can(
  role: RbacRole | null | undefined,
  permission: AdminPermission,
): boolean {
  return hasPermission(role, permission);
}

export function permissionsFor(role: RbacRole): AdminPermission[] {
  return permissionsForRole(role);
}
