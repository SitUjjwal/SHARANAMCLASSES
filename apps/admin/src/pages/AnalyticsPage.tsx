/**
 * AnalyticsPage — platform analytics with Recharts.
 */
import { useCallback, useEffect, useState } from 'react';

import type { AdminAnalyticsOverview } from '@sharanam/shared';

import {
  AverageTestScoresChart,
  RankingBarChart,
  RevenueGrowthChart,
  StudentGrowthChart,
} from '@/components/AnalyticsCharts';
import { DashboardCard } from '@/components/DashboardCard';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchAnalyticsOverview } from '@/services/analyticsService';
import { ApiClientError } from '@/services/api';

export function AnalyticsPage() {
  const { can } = useAuth();
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!can('analytics:view')) {
      setLoading(false);
      setError('You do not have permission to view analytics.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAnalyticsOverview());
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load analytics',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can('analytics:view')) {
    return (
      <div className="page">
        <PageHeader title="Analytics" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        description={`Growth, popularity, engagement, and test performance · ${data?.timezone ?? 'Asia/Kolkata'}`}
        actions={
          <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading && !data ? <p className="hint">Loading analytics…</p> : null}

      {data ? (
        <>
          <section className="dash-kpi-grid" aria-label="Analytics KPIs">
            <DashboardCard label="Total Students" value={data.kpis.total_students} />
            <DashboardCard
              label="Active Students"
              value={data.kpis.active_students}
              tone="success"
            />
            <DashboardCard label="Enrollments" value={data.kpis.total_enrollments} />
            {can('payments:view') ? (
              <DashboardCard
                label="Revenue This Month"
                value={data.kpis.monthly_revenue_display}
                tone="accent"
              />
            ) : null}
            <DashboardCard
              label="Avg Test Score"
              value={`${data.kpis.avg_test_score}%`}
            />
            <DashboardCard label="Pass Rate" value={`${data.kpis.pass_rate}%`} />
            <DashboardCard
              label="Live Classes Today"
              value={data.kpis.live_classes_today}
            />
          </section>

          <section className="dash-charts-grid" aria-label="Growth charts">
            <StudentGrowthChart data={data.student_growth} />
            {can('payments:view') ? (
              <RevenueGrowthChart data={data.revenue_growth} />
            ) : null}
          </section>

          <section className="dash-charts-grid" aria-label="Popularity charts">
            <RankingBarChart
              title="Course Popularity"
              subtitle="Top courses by enrollments"
              data={data.course_popularity}
              color="#0b1f3a"
            />
            <RankingBarChart
              title="Most Viewed Videos"
              subtitle="Unique watch-progress rows per video"
              data={data.most_viewed_videos}
              color="#1e4d7b"
              emptyMessage="No video watch data yet."
            />
            <RankingBarChart
              title="Most Downloaded PDFs"
              subtitle="Requires pdf_download_events (migration 20260803040000)"
              data={data.most_downloaded_pdfs}
              color="#5b4a1f"
              emptyMessage="No PDF downloads tracked yet. Apply analytics events migration and wire download logging."
            />
            <RankingBarChart
              title="Live Class Attendance"
              subtitle="Joins per live class"
              data={data.live_class_attendance}
              color="#1f7a4d"
              emptyMessage="No attendance records yet. Apply analytics events migration and record joins."
            />
          </section>

          <section className="dash-charts-grid" aria-label="Test charts">
            <AverageTestScoresChart data={data.average_test_scores} />
          </section>
        </>
      ) : null}
    </div>
  );
}
