/**
 * RBAC routes.
 *
 *   GET   /admin/rbac/me
 *   GET   /admin/rbac/matrix
 *   GET   /admin/rbac/staff
 *   PATCH /admin/rbac/staff/:userId
 */
import { Router } from 'express';

import {
  getMyRbacHandler,
  getRbacMatrixHandler,
  listRbacStaffHandler,
  patchStaffRoleHandler,
} from '../controllers/rbac.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const rbacRouter = Router();

rbacRouter.get(
  '/admin/rbac/me',
  requireAuth,
  requirePermission('dashboard:read'),
  getMyRbacHandler,
);

rbacRouter.get(
  '/admin/rbac/matrix',
  requireAuth,
  requirePermission('roles:read'),
  getRbacMatrixHandler,
);

rbacRouter.get(
  '/admin/rbac/staff',
  requireAuth,
  requirePermission('roles:read'),
  listRbacStaffHandler,
);

rbacRouter.patch(
  '/admin/rbac/staff/:userId',
  requireAuth,
  requirePermission('roles:update'),
  patchStaffRoleHandler,
);
