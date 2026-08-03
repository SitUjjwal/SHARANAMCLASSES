# RBAC (Role-Based Access Control)

## Architecture

```
profiles.role (DB)
  student | super_admin | admin | teacher | support
  (+ legacy instructor → treated as teacher)
        │
        ▼
@sharanam/shared rbac.ts
  ROLE_PERMISSION_MATRIX[role] → module:create|read|update|delete
        │
   ┌────┴────┐
   ▼         ▼
 Admin UI    API
 can(perm)   requirePermission('module:action')
 sidebar     assertStaffPermission()
 RequireStaff
```

**Single source of truth:** `packages/shared/src/rbac.ts`  
API and admin UI both import the same matrix — no drift.

## Roles

| Role | DB value | Intent |
|------|----------|--------|
| **Super Admin** | `super_admin` | Full access + assign roles |
| **Admin** | `admin` | Full ops except Roles module |
| **Teacher** | `teacher` (legacy `instructor`) | Catalog (no delete), tests CRUD, analytics |
| **Support Staff** | `support` | Feedback, students read/update, comms, payments read |

Bootstrap: emails in `ADMIN_EMAILS` are promoted to **`super_admin`** once.

## Permissions

Format: **`module:action`**

**Actions:** `create` · `read` · `update` · `delete`

**Modules:** dashboard, students, teachers, courses, tests, payments, analytics, feedback, communications, reports, settings, roles

Legacy UI aliases still work (`students:manage` → all students CRUD, `payments:view` → `payments:read`, etc.).

## Protecting APIs

Every admin route uses:

```ts
requireAuth,
requirePermission('courses:update'),
```

Middleware (`apps/api/src/middlewares/requirePermission.ts`):

1. Requires JWT (`requireAuth`)
2. Resolves `profiles.role` → RBAC role
3. Checks matrix; **403** with missing permission if denied
4. Attaches `req.staff` (`role`, `permissions`, …)

Dual-purpose student/admin GETs (e.g. `/courses`) use `hasStaffPermission(..., 'courses:read')` inside the controller to choose admin vs student payload.

## Admin UI

- Sidebar: every nav item has a `permission`; filtered via `can()`
- `RequireStaff` blocks students from the portal
- **Roles & Access** (`/roles`): matrix + staff assignment (Super Admin only)
- Topbar shows role label (Super Admin / Admin / Teacher / Support Staff)

## APIs

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/rbac/me` | `dashboard:read` |
| GET | `/admin/rbac/matrix` | `roles:read` |
| GET | `/admin/rbac/staff` | `roles:read` |
| PATCH | `/admin/rbac/staff/:userId` | `roles:update` |

## Security notes

1. **UI is not security** — hiding nav is UX; the API enforces permissions.
2. **RLS** still protects tables; staff mutations go through the API service role after permission checks.
3. **Role assignment** is Super Admin only; cannot demote self.
4. **Students** have no staff role → portal denied + no admin permissions.

## Migration

Apply: `infra/supabase/migrations/20260803050000_rbac_roles.sql`

Then set roles, e.g.:

```sql
update profiles set role = 'super_admin' where email = 'you@example.com';
update profiles set role = 'support' where email = 'help@example.com';
update profiles set role = 'teacher' where email = 'teach@example.com';
```

## Files

| Path | Role |
|------|------|
| `packages/shared/src/rbac.ts` | Matrix + helpers |
| `apps/api/src/services/role.service.ts` | Resolve staff context |
| `apps/api/src/middlewares/requirePermission.ts` | Route gate |
| `apps/api/src/routes/rbac.routes.ts` | RBAC HTTP API |
| `apps/admin/src/features/auth/permissions.ts` | UI `can()` |
| `apps/admin/src/pages/RolesPage.tsx` | Matrix + assign |
| `docs/api/rbac.md` | This doc |
