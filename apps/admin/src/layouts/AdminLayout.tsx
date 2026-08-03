/**
 * Admin shell layout — sidebar + topbar (theme toggle, role badge, sign out).
 */
import { Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { AdminSidebar } from '@/layouts/AdminSidebar';
import { useTheme } from '@/theme/ThemeProvider';

export function AdminLayout() {
  const { user, roleLabel } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-meta">
            <span className="admin-role-badge" title="RBAC role from profiles.role">
              {roleLabel}
            </span>
            <span>{user?.email}</span>
          </div>
          <div className="admin-topbar-actions">
            <button type="button" className="btn ghost" onClick={toggleTheme} aria-label="Toggle color theme">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
