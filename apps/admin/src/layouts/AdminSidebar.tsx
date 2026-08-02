/**
 * Admin sidebar — sectioned nav (Feedback & Support cluster first).
 */
import { NavLink } from 'react-router-dom';

import {
  ADMIN_NAV,
  ADMIN_NAV_SECTION_LABELS,
  APP_NAME,
  type AdminNavSection,
} from '@/constants';

const SECTION_ORDER: AdminNavSection[] = [
  'main',
  'feedback',
  'comms',
  'catalog',
  'tests',
  'people',
  'billing',
];

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
        {SECTION_ORDER.map((section) => {
          const items = ADMIN_NAV.filter((item) => item.section === section);
          if (!items.length) return null;
          const label = ADMIN_NAV_SECTION_LABELS[section];
          return (
            <div key={section} className="admin-nav-section">
              {label ? (
                <p className="admin-nav-section-label">{label}</p>
              ) : null}
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
            </div>
          );
        })}
      </nav>

      <p className="admin-sidebar-foot">{APP_NAME}</p>
    </aside>
  );
}
