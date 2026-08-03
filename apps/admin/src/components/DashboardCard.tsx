/**
 * DashboardCard — single KPI tile for the admin home dashboard.
 *
 * Props:
 * - label: short metric name
 * - value: formatted display value
 * - hint: optional secondary line (e.g. "Last 30 days")
 * - tone: visual emphasis for revenue / alerts
 * - to: optional deep-link path
 */
import { Link } from 'react-router-dom';

type DashboardCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'accent' | 'success' | 'warn';
  to?: string;
};

export function DashboardCard({
  label,
  value,
  hint,
  tone = 'default',
  to,
}: DashboardCardProps) {
  const body = (
    <>
      <span className="dash-card-label">{label}</span>
      <strong className="dash-card-value">{value}</strong>
      {hint ? <span className="dash-card-hint">{hint}</span> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`dash-card dash-card-${tone}`}>
        {body}
      </Link>
    );
  }

  return <div className={`dash-card dash-card-${tone}`}>{body}</div>;
}
