/**
 * AnalyticsChartPanel — shared Recharts shell for analytics dashboard.
 */
import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function AnalyticsChartPanel({
  title,
  subtitle,
  children,
  empty = false,
  emptyMessage = 'No data yet.',
}: Props) {
  return (
    <div className="dash-chart-panel">
      <header className="dash-chart-header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div className="dash-chart-body">
        {empty ? <p className="hint">{emptyMessage}</p> : children}
      </div>
    </div>
  );
}
