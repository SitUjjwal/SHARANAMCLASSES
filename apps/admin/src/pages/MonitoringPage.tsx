/**
 * MonitoringPage — Module 11 live ops dashboard.
 * Tracks API/DB latency, memory/CPU, and payment/notification failures.
 */
import { useCallback, useEffect, useState } from 'react';

import type { MonitoringOverview } from '@sharanam/shared';

import { DashboardCard } from '@/components/DashboardCard';
import {
  MonitoringAreaChart,
  MonitoringLineChart,
} from '@/components/MonitoringCharts';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchMonitoringOverview } from '@/services/monitoringService';
import { ApiClientError } from '@/services/api';

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

export function MonitoringPage() {
  const { can } = useAuth();
  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    if (!can('settings:read')) {
      setLoading(false);
      setError('You do not have permission to view monitoring.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMonitoringOverview());
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load monitoring',
      );
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh || !can('settings:read')) return;
    const id = setInterval(() => {
      void load();
    }, 15_000);
    return () => clearInterval(id);
  }, [autoRefresh, can, load]);

  if (!can('settings:read')) {
    return (
      <div className="page">
        <PageHeader title="Monitoring" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Monitoring"
        description={
          data
            ? `Live process metrics · last ${data.window_minutes} min · uptime ${formatUptime(data.uptime_seconds)}`
            : 'API, database, memory, CPU, and failure counters'
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="checkbox-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto 15s
            </label>
            <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </div>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading && !data ? <p className="hint">Loading monitoring…</p> : null}

      {data ? (
        <>
          <section className="dash-kpi-grid" aria-label="Health KPIs">
            <DashboardCard
              label="Active alerts"
              value={data.active_alert_count}
              hint={
                data.alerts[0]
                  ? data.alerts[0].message
                  : 'No threshold alerts'
              }
              tone={
                data.active_alert_count > 0
                  ? data.alerts.some((a) => a.severity === 'critical' && !a.acknowledged)
                    ? 'warn'
                    : 'warn'
                  : 'success'
              }
            />
            <DashboardCard
              label="API avg latency"
              value={`${data.api.latency.avg_ms} ms`}
              hint={`p95 ${data.api.latency.p95_ms} ms · ${data.api.requests} req`}
              tone="accent"
            />
            <DashboardCard
              label="DB avg latency"
              value={`${data.database.latency.avg_ms} ms`}
              hint={
                data.database.last_error
                  ? data.database.last_error
                  : data.database.last_ok_at
                    ? `Last OK ${new Date(data.database.last_ok_at).toLocaleTimeString()}`
                    : 'Waiting for probe…'
              }
              tone={data.database.last_error ? 'warn' : 'success'}
            />
            <DashboardCard
              label="Memory (RSS)"
              value={`${data.process.memory.rss_mb} MB`}
              hint={`Heap ${data.process.memory.heap_used_mb}/${data.process.memory.heap_total_mb} MB`}
            />
            <DashboardCard
              label="CPU"
              value={`${data.process.cpu.process_percent}%`}
              hint={`Load 1m ${data.process.cpu.load_avg_1m}`}
            />
            <DashboardCard
              label="Failed requests"
              value={data.failures.failed_requests}
              hint={`Success ${data.api.success_rate_percent}%`}
              tone={data.failures.failed_requests > 0 ? 'warn' : 'default'}
            />
            <DashboardCard
              label="Failed payments"
              value={data.failures.failed_payments}
              tone={data.failures.failed_payments > 0 ? 'warn' : 'default'}
              to="/payments"
            />
            <DashboardCard
              label="Notification failures"
              value={data.failures.notification_failures}
              tone={data.failures.notification_failures > 0 ? 'warn' : 'default'}
              to="/delivery-reports"
            />
            <DashboardCard
              label="Process"
              value={`PID ${data.process.pid}`}
              hint={data.process.node_version}
            />
          </section>

          <section className="dash-charts-grid" aria-label="Latency charts">
            <MonitoringAreaChart
              title="API latency (avg ms)"
              subtitle="Per-minute average response time"
              data={data.api.latency_series}
              color="#0b1f3a"
              unit=" ms"
            />
            <MonitoringLineChart
              title="Requests / minute"
              subtitle="Traffic volume"
              data={data.api.rpm_series}
              color="#1e4d7b"
            />
            <MonitoringAreaChart
              title="Database latency (avg ms)"
              subtitle="Periodic probe + timed queries"
              data={data.database.latency_series}
              color="#1f7a4d"
              unit=" ms"
            />
            <MonitoringLineChart
              title="Failed requests / minute"
              subtitle="HTTP 4xx + 5xx"
              data={data.failures.failed_requests_series}
              color="#b45309"
            />
            <MonitoringLineChart
              title="Failed payments / minute"
              subtitle="Orders marked failed"
              data={data.failures.failed_payments_series}
              color="#c62828"
            />
            <MonitoringLineChart
              title="Notification failures / minute"
              subtitle="Push delivery failures"
              data={data.failures.notification_failures_series}
              color="#7c3aed"
            />
          </section>

          <section className="page-section" aria-label="Alerts">
            <h3 style={{ marginBottom: 8 }}>Alerts</h3>
            {!data.alerts?.length ? (
              <p className="hint">No alerts yet. Threshold breaches appear here and in API logs.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Severity</th>
                      <th>Code</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>{new Date(alert.created_at).toLocaleString()}</td>
                        <td>{alert.severity}</td>
                        <td>
                          <code>{alert.code}</code>
                        </td>
                        <td>{alert.message}</td>
                        <td>{alert.acknowledged ? 'Ack' : 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="page-section" aria-label="Slow routes">
            <h3 style={{ marginBottom: 8 }}>Slowest routes (window)</h3>
            {!data.top_slow_routes.length ? (
              <p className="hint">Need a few samples per route before ranking appears.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Samples</th>
                      <th>Avg</th>
                      <th>p95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_slow_routes.map((row) => (
                      <tr key={row.method_path}>
                        <td>
                          <code>{row.method_path}</code>
                        </td>
                        <td>{row.count}</td>
                        <td>{row.avg_ms} ms</td>
                        <td>{row.p95_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
