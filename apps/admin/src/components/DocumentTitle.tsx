/**
 * Sets document.title for staff routes (admin SEO / tab labels).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/login': 'Login',
  '/courses': 'Courses',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/payments': 'Payments',
  '/settings': 'Settings',
  '/versions': 'App versions',
  '/monitoring': 'Monitoring',
  '/backups': 'Backups',
  '/analytics': 'Analytics',
  '/roles': 'Roles',
};

function titleForPath(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return 'Dashboard';
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = titleForPath(pathname);
    document.title = `${page} — SHARANAM CLASSES Admin`;
  }, [pathname]);

  return null;
}
