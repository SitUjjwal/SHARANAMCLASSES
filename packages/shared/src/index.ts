export * from './types';
export * from './constants';
export * from './schemas';
export * from './utils';
export * from './rbac';

/** Explicit value re-exports for bundlers that cannot see CJS `export *`. */
export { TEST_TYPE_LABELS } from './types/course';
export {
  RBAC_ROLES,
  RBAC_ROLE_LABELS,
  RBAC_MODULES,
  RBAC_MODULE_LABELS,
  RBAC_ACTIONS,
  STAFF_PROFILE_ROLES,
  ROLE_PERMISSION_MATRIX,
  resolveRbacRole,
  resolveUiRole,
  isStaffProfileRole,
  permissionsForRole,
  expandPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  buildPermissionMatrixTable,
} from './rbac';
