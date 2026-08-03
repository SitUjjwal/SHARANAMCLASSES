/**
 * Analytics dashboard charts — Recharts wrappers.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  AdminAnalyticsChartPoint,
  AdminAnalyticsRankItem,
} from '@sharanam/shared';

import { AnalyticsChartPanel } from '@/components/AnalyticsChartPanel';

export function StudentGrowthChart({ data }: { data: AdminAnalyticsChartPoint[] }) {
  return (
    <AnalyticsChartPanel
      title="Student Growth"
      subtitle="New student signups · last 6 months"
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="studentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e4d7b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#1e4d7b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            name="Students"
            stroke="#1e4d7b"
            fill="url(#studentFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}

export function RevenueGrowthChart({ data }: { data: AdminAnalyticsChartPoint[] }) {
  return (
    <AnalyticsChartPanel
      title="Revenue Growth"
      subtitle="Paid orders · last 14 days (₹)"
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#revFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}

export function RankingBarChart({
  title,
  subtitle,
  data,
  emptyMessage,
  color = '#0b1f3a',
}: {
  title: string;
  subtitle: string;
  data: AdminAnalyticsRankItem[];
  emptyMessage?: string;
  color?: string;
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    value: d.value,
  }));

  return (
    <AnalyticsChartPanel
      title={title}
      subtitle={subtitle}
      empty={!data.length}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}

export function AverageTestScoresChart({
  data,
}: {
  data: AdminAnalyticsChartPoint[];
}) {
  return (
    <AnalyticsChartPanel
      title="Average Test Scores"
      subtitle="Daily average % · last scored days"
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="dash-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
          <Tooltip formatter={(value: number) => [`${value}%`, 'Avg score']} />
          <Line
            type="monotone"
            dataKey="value"
            name="Avg %"
            stroke="#1f7a4d"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsChartPanel>
  );
}
