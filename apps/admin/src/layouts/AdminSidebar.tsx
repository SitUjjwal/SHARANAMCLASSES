/**
 * Admin sidebar — grouped nav + Logout.
 */
import { NavLink } from 'react-router-dom';

import {
  ADMIN_NAV,
  ADMIN_NAV_SECTION_LABELS,
  ADMIN_NAV_SECTION_ORDER,
  APP_NAME,
  type AdminNavSection,
} from '@/constants';
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
        {ADMIN_NAV_SECTION_ORDER.map((section) => {
          const sectionItems = items.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;
          const label = ADMIN_NAV_SECTION_LABELS[section as AdminNavSection];
          return (
            <div key={section} className="admin-nav-section">
              {label ? <p className="admin-nav-section-label">{label}</p> : null}
              {sectionItems.map((item) => (
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
            </div>
          );
        })}
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
