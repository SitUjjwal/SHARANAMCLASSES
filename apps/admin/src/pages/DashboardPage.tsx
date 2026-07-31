import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { ADMIN_NAV } from '@/constants';

export function DashboardPage() {
  const modules = ADMIN_NAV.filter((item) => item.path !== '/');

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description="Welcome to the SHARANAM CLASSES admin panel. Choose a module to manage the catalog and students."
      />

      <div className="dashboard-grid">
        {modules.map((item) => (
          <Link key={item.path} to={item.path} className="dashboard-tile">
            <h2>{item.label}</h2>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
