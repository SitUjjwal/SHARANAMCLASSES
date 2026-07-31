/**
 * Admin shell layout — fixed sidebar + main content outlet.
 */
import { Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { AdminSidebar } from '@/layouts/AdminSidebar';

export function AdminLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-topbar">
          <span>{user?.email}</span>
          <button type="button" className="btn ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
