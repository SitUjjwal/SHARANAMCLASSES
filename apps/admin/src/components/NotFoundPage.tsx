/**
 * In-app 404 for unknown React Router paths.
 */
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="error-page">
      <div className="error-page-card">
        <h1>Page not found</h1>
        <p className="muted">This admin route does not exist or was moved.</p>
        <div className="error-page-actions">
          <Link className="btn primary" to="/">
            Back to dashboard
          </Link>
          <Link className="btn" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
