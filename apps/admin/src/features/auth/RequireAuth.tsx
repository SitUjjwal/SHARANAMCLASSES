/**
 * RequireAuth — session required.
 * RequireStaff — staff RBAC role required (blocks students).
 */
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingPage } from '@/components/LoadingPage';
import { useAuth } from '@/features/auth/AuthProvider';
import type { AdminPermission } from '@sharanam/shared';

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingPage message="Loading session…" />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireStaff() {
  const { loading, isStaff, signOut, user, profileRole } = useAuth();

  if (loading) {
    return <LoadingPage message="Loading session…" />;
  }

  if (!isStaff) {
    const email = user?.email ?? 'YOUR_EMAIL@example.com';
    const sql = `update public.profiles set role = 'admin' where email = '${email}';`;
    return (
      <div className="page">
        <h1>Access denied</h1>
        <p>This portal is for Super Admin, Admin, Teacher, and Support Staff only.</p>
        <p>
          Signed in as <strong>{email}</strong>
          {profileRole ? (
            <>
              {' '}
              (profile role: <code>{profileRole}</code>)
            </>
          ) : null}
          . That account is not staff yet.
        </p>
        <p>Fix in Supabase → SQL Editor (then Sign out and log in again):</p>
        <pre
          style={{
            fontSize: 12,
            overflow: 'auto',
            padding: 12,
            background: 'var(--surface-2, #f4f4f5)',
            borderRadius: 8,
          }}
        >
          {sql}
        </pre>
        <p style={{ fontSize: 13, opacity: 0.85 }}>
          Or add this email to <code>ADMIN_EMAILS</code> in <code>apps/api/.env</code> and restart
          the API.
        </p>
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
