/**
 * StudentChart — new student signups by month (Recharts BarChart).
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminChartPoint } from '@sharanam/shared';

type Props = {
  data: AdminChartPoint[];
};

export function StudentChart({ data }: Props) {
  return (
    <div className="dash-chart-panel">
      <header className="dash-chart-header">
        <h2>New students</h2>
        <p>Signups over the last 6 months</p>
      </header>
      <div className="dash-chart-body">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Bar dataKey="value" name="Students" fill="#1e4d7b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
