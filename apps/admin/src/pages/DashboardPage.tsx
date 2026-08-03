/**
 * DashboardPage — production admin home with KPIs + Recharts.
 *
 * Components used:
 * - PageHeader: title + description
 * - DashboardCard: each KPI tile (students, revenue, courses, …)
 * - RevenueChart / StudentChart / CourseChart: Recharts visualizations
 * - DataTable: quick links / pending queues snapshot
 * - useAuth().can: hide payment KPIs for roles without payments:view
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AdminDashboardOverview } from '@sharanam/shared';

import { CourseChart } from '@/components/CourseChart';
import { DashboardCard } from '@/components/DashboardCard';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { RevenueChart } from '@/components/RevenueChart';
import { StudentChart } from '@/components/StudentChart';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchDashboardOverview } from '@/services/analyticsService';
import { ApiClientError } from '@/services/api';

type QueueRow = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export function DashboardPage() {
  const { can, role } = useAuth();
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!can('dashboard:view')) {
      setLoading(false);
      setError('You do not have permission to view the dashboard.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardOverview());
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  const queues = useMemo<QueueRow[]>(() => {
    if (!data) return [];
    return [
      {
        id: 'feedback',
        label: 'Feedback pending',
        count: data.feedback_pending,
        href: '/feedback',
      },
      {
        id: 'support',
        label: 'Support tickets (open chats)',
        count: data.support_tickets_open,
        href: '/support-chat',
      },
      {
        id: 'reviews',
        label: 'Reviews awaiting approval',
        count: data.pending_reviews,
        href: '/reviews',
      },
      {
        id: 'bugs',
        label: 'Open bug reports',
        count: data.open_bug_reports,
        href: '/bug-reports',
      },
      {
        id: 'payments',
        label: 'Pending payments',
        count: data.pending_payments,
        href: '/payments',
      },
    ];
  }, [data]);

  if (!can('dashboard:view')) {
    return (
      <div className="page">
        <PageHeader title="Dashboard" description="Access restricted for your role." />
        <p className="form-error">Role `{role}` cannot view dashboard metrics.</p>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Live platform KPIs — students, revenue, catalog, support, and feedback."
        actions={
          <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading && !data ? <p className="hint">Loading overview…</p> : null}

      {data ? (
        <>
          <section className="dash-kpi-grid" aria-label="Key metrics">
            <DashboardCard
              label="Total Students"
              value={data.total_students}
              to="/students"
            />
            <DashboardCard
              label="Active Students"
              value={data.active_students}
              hint="With at least one enrollment"
              tone="success"
              to="/students"
            />
            {can('payments:view') ? (
              <>
                <DashboardCard
                  label="Revenue Today"
                  value={data.today_revenue_display}
                  tone="accent"
                  to="/payments"
                />
                <DashboardCard
                  label="Revenue This Month"
                  value={data.monthly_revenue_display}
                  tone="accent"
                  to="/payments"
                />
              </>
            ) : null}
            <DashboardCard
              label="Total Courses"
              value={data.total_courses}
              hint={`${data.published_courses} published`}
              to="/courses"
            />
            <DashboardCard
              label="Total Teachers"
              value={data.total_teachers}
              to="/teachers"
            />
            <DashboardCard
              label="Total Tests"
              value={data.total_tests}
              to="/tests"
            />
            <DashboardCard
              label="Live Classes Today"
              value={data.live_classes_today}
              to="/live-classes"
            />
            <DashboardCard
              label="Support Tickets"
              value={data.support_tickets_open}
              hint="Open chat threads"
              tone="warn"
              to="/support-chat"
            />
            <DashboardCard
              label="Feedback Pending"
              value={data.feedback_pending}
              hint="Open + in progress"
              tone="warn"
              to="/feedback"
            />
          </section>

          <section className="dash-charts-grid" aria-label="Charts">
            {can('payments:view') ? (
              <RevenueChart data={data.revenue_series} />
            ) : null}
            <StudentChart data={data.student_series} />
            <CourseChart data={data.course_series} />
          </section>

          <section className="dash-queues" aria-label="Queues">
            <h2 className="dash-section-title">Attention queues</h2>
            <DataTable
              rows={queues}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: 'label',
                  header: 'Queue',
                  render: (row) => row.label,
                },
                {
                  key: 'count',
                  header: 'Count',
                  render: (row) => <strong>{row.count}</strong>,
                },
                {
                  key: 'open',
                  header: '',
                  render: (row) => (
                    <Link className="btn" to={row.href}>
                      Open
                    </Link>
                  ),
                },
              ]}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
