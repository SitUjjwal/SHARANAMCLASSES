/**
 * RevenuePage — paid revenue KPIs + 14-day chart.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AdminRevenueOverview } from '@sharanam/shared';

import { DashboardCard } from '@/components/DashboardCard';
import { PageHeader } from '@/components/PageHeader';
import { RevenueChart } from '@/components/RevenueChart';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchRevenueOverview } from '@/services/analyticsService';
import { ApiClientError } from '@/services/api';

export function RevenuePage() {
  const { can } = useAuth();
  const [data, setData] = useState<AdminRevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!can('payments:view')) {
      setLoading(false);
      setError('You do not have permission to view revenue.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchRevenueOverview());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load revenue');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can('payments:view')) {
    return (
      <div className="page">
        <PageHeader title="Revenue" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Revenue"
        description={`Paid orders only · timezone ${data?.timezone ?? 'Asia/Kolkata'}`}
        actions={
          <>
            <Link className="btn ghost" to="/payments">
              Payments
            </Link>
            <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading && !data ? <p className="hint">Loading revenue…</p> : null}

      {data ? (
        <>
          <section className="dash-kpi-grid" aria-label="Revenue KPIs">
            <DashboardCard label="Revenue Today" value={data.today_revenue_display} tone="accent" />
            <DashboardCard
              label="Revenue This Month"
              value={data.monthly_revenue_display}
              tone="accent"
            />
            <DashboardCard label="Total Paid" value={data.total_paid_display} tone="success" />
            <DashboardCard label="Paid Orders" value={data.paid_orders} />
            <DashboardCard label="Pending" value={data.pending_payments} tone="warn" />
            <DashboardCard label="Failed" value={data.failed_payments} tone="warn" />
          </section>
          <RevenueChart data={data.revenue_series} />
        </>
      ) : null}
    </div>
  );
}
