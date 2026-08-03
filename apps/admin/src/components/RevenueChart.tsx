/**
 * RevenueChart — last 14 days paid revenue (INR) using Recharts AreaChart.
 */
import {
  Area,
  AreaChart,
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

export function RevenueChart({ data }: Props) {
  return (
    <div className="dash-chart-panel">
      <header className="dash-chart-header">
        <h2>Revenue (14 days)</h2>
        <p>Paid orders · amounts in ₹</p>
      </header>
      <div className="dash-chart-body">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a227" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#c9a227" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#c9a227"
              fill="url(#revenueFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
