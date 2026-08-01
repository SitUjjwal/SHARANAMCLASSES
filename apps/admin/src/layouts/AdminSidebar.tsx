/**
 * Admin sidebar — Dashboard, Courses, Tests, Questions, Results, Leaderboard, Analytics, …
 */
import { NavLink } from 'react-router-dom';

import { ADMIN_NAV, APP_NAME } from '@/constants';

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img
          src="/logo.png"
          alt="SHARANAM CLASSES"
          className="admin-brand-logo"
        />
        <div>
          <strong>SHARANAM</strong>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin">
        {ADMIN_NAV.map((item) => (
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

      <p className="admin-sidebar-foot">{APP_NAME}</p>
    </aside>
  );
}
