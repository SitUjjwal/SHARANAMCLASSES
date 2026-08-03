/**
 * Admin sidebar — primary flat nav + Logout.
 */
import { NavLink } from 'react-router-dom';

import { ADMIN_NAV, APP_NAME } from '@/constants';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBrandLogo, useBrandName } from '@/features/platform/PlatformProvider';

export function AdminSidebar() {
  const { can, signOut } = useAuth();
  const logo = useBrandLogo();
  const brandName = useBrandName();

  const items = ADMIN_NAV.filter((item) => can(item.permission));

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src={logo} alt={brandName} className="admin-brand-logo" />
        <div>
          <strong>{brandName.split(' ')[0] || 'SHARANAM'}</strong>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'admin-nav-link is-active' : 'admin-nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-foot">
        <button
          type="button"
          className="admin-nav-link admin-logout-btn"
          onClick={() => void signOut()}
        >
          Logout
        </button>
        <p className="admin-sidebar-foot-brand">{APP_NAME}</p>
      </div>
    </aside>
  );
}
