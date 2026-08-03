/**
 * RBAC — roles, modules, CRUD permissions, and default role matrices.
 * Single source of truth for API + admin UI.
 */

export const RBAC_ROLES = [
  'super_admin',
  'admin',
  'teacher',
  'support',
] as const;

export type RbacRole = (typeof RBAC_ROLES)[number];

export const RBAC_ROLE_LABELS: Record<RbacRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  support: 'Support Staff',
};

/** profiles.role values that grant staff portal access (includes legacy instructor). */
export const STAFF_PROFILE_ROLES = [
  'super_admin',
  'admin',
  'teacher',
  'instructor',
  'support',
] as const;

export type StaffProfileRole = (typeof STAFF_PROFILE_ROLES)[number];

export const RBAC_MODULES = [
  'dashboard',
  'students',
  'teachers',
  'courses',
  'tests',
  'payments',
  'analytics',
  'feedback',
  'communications',
  'reports',
  'settings',
  'roles',
] as const;

export type RbacModule = (typeof RBAC_MODULES)[number];

export const RBAC_MODULE_LABELS: Record<RbacModule, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  teachers: 'Teachers',
  courses: 'Courses & Catalog',
  tests: 'Tests & Questions',
  payments: 'Payments & Revenue',
  analytics: 'Analytics',
  feedback: 'Feedback & Support',
  communications: 'Communications',
  reports: 'Reports',
  settings: 'Settings & Activity',
  roles: 'Roles & Access',
};

export const RBAC_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export type RbacPermission = `${RbacModule}:${RbacAction}`;

/** Legacy UI permission codes still accepted by can(). */
export type LegacyAdminPermission =
  | 'dashboard:view'
  | 'students:manage'
  | 'teachers:manage'
  | 'courses:manage'
  | 'payments:view'
  | 'analytics:view'
  | 'feedback:manage'
  | 'settings:manage'
  | 'reports:export';

export type AdminPermission = RbacPermission | LegacyAdminPermission;

/** @deprecated Use RbacRole — kept for gradual UI migration. */
export type AdminUiRole = RbacRole;

function allCrud(module: RbacModule): RbacPermission[] {
  return RBAC_ACTIONS.map((action) => `${module}:${action}` as RbacPermission);
}

function crud(
  module: RbacModule,
  actions: readonly RbacAction[],
): RbacPermission[] {
  return actions.map((action) => `${module}:${action}` as RbacPermission);
}

const ALL_PERMISSIONS: RbacPermission[] = RBAC_MODULES.flatMap((module) =>
  allCrud(module),
);

/**
 * Default permission matrix (module × CRUD) per role.
 * Super Admin: everything. Admin: everything except roles.
 */
export const ROLE_PERMISSION_MATRIX: Record<RbacRole, readonly RbacPermission[]> = {
  super_admin: ALL_PERMISSIONS,

  admin: ALL_PERMISSIONS.filter((p) => !p.startsWith('roles:')),

  teacher: [
    ...crud('dashboard', ['read']),
    ...crud('courses', ['create', 'read', 'update']),
    ...crud('tests', ['create', 'read', 'update', 'delete']),
    ...crud('analytics', ['read']),
    ...crud('feedback', ['read']),
    ...crud('communications', ['read']),
    ...crud('students', ['read']),
  ],

  support: [
    ...crud('dashboard', ['read']),
    ...crud('students', ['read', 'update']),
    ...crud('feedback', ['create', 'read', 'update', 'delete']),
    ...crud('communications', ['create', 'read', 'update']),
    ...crud('payments', ['read']),
    ...crud('reports', ['read']),
    ...crud('analytics', ['read']),
  ],
};

const LEGACY_ALIASES: Record<LegacyAdminPermission, readonly RbacPermission[]> = {
  'dashboard:view': ['dashboard:read'],
  'students:manage': allCrud('students'),
  'teachers:manage': allCrud('teachers'),
  'courses:manage': allCrud('courses'),
  'payments:view': ['payments:read'],
  'analytics:view': ['analytics:read'],
  'feedback:manage': allCrud('feedback'),
  'settings:manage': allCrud('settings'),
  'reports:export': ['reports:read', 'reports:create'],
};

const ROLE_SETS: Record<RbacRole, ReadonlySet<RbacPermission>> = {
  super_admin: new Set(ROLE_PERMISSION_MATRIX.super_admin),
  admin: new Set(ROLE_PERMISSION_MATRIX.admin),
  teacher: new Set(ROLE_PERMISSION_MATRIX.teacher),
  support: new Set(ROLE_PERMISSION_MATRIX.support),
};

/** Map profiles.role → RBAC role (instructor → teacher). */
export function resolveRbacRole(
  profileRole: string | null | undefined,
): RbacRole | null {
  if (!profileRole) return null;
  if (profileRole === 'super_admin') return 'super_admin';
  if (profileRole === 'admin') return 'admin';
  if (profileRole === 'teacher' || profileRole === 'instructor') return 'teacher';
  if (profileRole === 'support') return 'support';
  return null;
}

/**
 * Resolve UI role for the admin app. Returns null for students / unknown.
 * @deprecated Prefer resolveRbacRole
 */
export function resolveUiRole(
  profileRole: string | null | undefined,
): RbacRole | null {
  return resolveRbacRole(profileRole);
}

export function isStaffProfileRole(role: string | null | undefined): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'teacher' ||
    role === 'instructor' ||
    role === 'support'
  );
}

export function permissionsForRole(role: RbacRole): RbacPermission[] {
  return [...ROLE_PERMISSION_MATRIX[role]];
}

export function expandPermission(permission: AdminPermission): RbacPermission[] {
  if (permission in LEGACY_ALIASES) {
    return [...LEGACY_ALIASES[permission as LegacyAdminPermission]];
  }
  return [permission as RbacPermission];
}

/** True if role grants the permission (supports legacy :view / :manage aliases). */
export function hasPermission(
  role: RbacRole | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!role) return false;
  const set = ROLE_SETS[role];
  return expandPermission(permission).some((p) => set.has(p));
}

export function hasAnyPermission(
  role: RbacRole | null | undefined,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: RbacRole | null | undefined,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Matrix rows for admin Roles UI / docs. */
export function buildPermissionMatrixTable(): Array<{
  module: RbacModule;
  action: RbacAction;
  permission: RbacPermission;
  roles: Record<RbacRole, boolean>;
}> {
  const rows: Array<{
    module: RbacModule;
    action: RbacAction;
    permission: RbacPermission;
    roles: Record<RbacRole, boolean>;
  }> = [];

  for (const module of RBAC_MODULES) {
    for (const action of RBAC_ACTIONS) {
      const permission = `${module}:${action}` as RbacPermission;
      rows.push({
        module,
        action,
        permission,
        roles: {
          super_admin: hasPermission('super_admin', permission),
          admin: hasPermission('admin', permission),
          teacher: hasPermission('teacher', permission),
          support: hasPermission('support', permission),
        },
      });
    }
  }

  return rows;
}
