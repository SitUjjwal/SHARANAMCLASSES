/**
 * CourseChart — courses grouped by category (Recharts horizontal bars).
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

export function CourseChart({ data }: Props) {
  return (
    <div className="dash-chart-panel">
      <header className="dash-chart-header">
        <h2>Courses by category</h2>
        <p>Catalog distribution</p>
      </header>
      <div className="dash-chart-body">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="value" name="Courses" fill="#0b1f3a" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
