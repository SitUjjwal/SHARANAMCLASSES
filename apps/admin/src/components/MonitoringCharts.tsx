/**
 * MonitoringCharts — Module 11 ops charts (Recharts).
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MonitoringSeriesPoint } from '@sharanam/shared';

import { AnalyticsChartPanel } from '@/components/AnalyticsChartPanel';

function formatTick(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type SeriesChartProps = {
  title: string;
  subtitle?: string;
  data: MonitoringSeriesPoint[];
  color: string;
  unit?: string;
  emptyMessage?: string;
};

export function MonitoringAreaChart({
  title,
  subtitle,
  data,
  color,
  unit = '',
  emptyMessage = 'No samples in this window yet.',
}: SeriesChartProps) {
  const gradId = `mon-fill-${color.replace('#', '')}`;
  return (
    <AnalyticsChartPanel
      title={title}
      subtitle={subtitle}
      empty={!data.length}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
          <XAxis dataKey="t" tickFormatter={formatTick} tick={{ fontSize: 11 }} minTickGap={28} />
          <YAxis tick={{ fontSize: 11 }} width={42} />
          <Tooltip
            labelFormatter={(v) => formatTick(String(v))}
            formatter={(value) => [`${String(value)}${unit}`, title]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${gradId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}

export function MonitoringLineChart({
  title,
  subtitle,
  data,
  color,
  unit = '',
  emptyMessage = 'No samples in this window yet.',
}: SeriesChartProps) {
  return (
    <AnalyticsChartPanel
      title={title}
      subtitle={subtitle}
      empty={!data.length}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
          <XAxis dataKey="t" tickFormatter={formatTick} tick={{ fontSize: 11 }} minTickGap={28} />
          <YAxis tick={{ fontSize: 11 }} width={42} />
          <Tooltip
            labelFormatter={(v) => formatTick(String(v))}
            formatter={(value) => [`${String(value)}${unit}`, title]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}
