/**
 * RequireAuth — session required.
 * RequireStaff — staff RBAC role required (blocks students).
 */
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import type { AdminPermission } from '@sharanam/shared';

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading">Loading session…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireStaff() {
  const { loading, isStaff, signOut } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading session…</div>;
  }

  if (!isStaff) {
    return (
      <div className="page">
        <h1>Access denied</h1>
        <p>This portal is for Super Admin, Admin, Teacher, and Support Staff only.</p>
        <button type="button" className="btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return <Outlet />;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: AdminPermission;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div className="page">
        <h1>Access denied</h1>
        <p>You do not have permission: {permission}</p>
      </div>
    );
  }
  return <>{children}</>;
}
