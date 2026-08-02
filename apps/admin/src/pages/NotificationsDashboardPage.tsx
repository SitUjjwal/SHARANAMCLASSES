/**
 * Admin Notification Dashboard — KPIs, search, filters, CSV export.
 */
import { useCallback, useEffect, useState } from 'react';

import type {
  NotificationAdminCampaignRow,
  NotificationAdminStats,
  NotificationCampaignStatus,
} from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  downloadCsvFile,
  exportNotificationAdminCsv,
  fetchNotificationAdminCampaigns,
  fetchNotificationAdminStats,
  type NotificationDashboardFilters,
} from '@/features/notifications/api';
import { ApiClientError } from '@/services/api';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadgeClass(status: NotificationCampaignStatus): string {
  if (status === 'sent') return 'badge badge-active';
  if (status === 'failed') return 'badge badge-failed';
  if (status === 'partial' || status === 'sending') return 'badge badge-pending';
  return 'badge badge-inactive';
}

export function NotificationsDashboardPage() {
  const [stats, setStats] = useState<NotificationAdminStats | null>(null);
  const [filters, setFilters] = useState<NotificationDashboardFilters>({
    search: '',
    status: 'all',
    type: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<NotificationAdminCampaignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFilters((prev) => {
        const next = searchInput.trim();
        if (prev.search === next) return prev;
        return { ...prev, search: next, page: 1 };
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchNotificationAdminStats());
    } catch {
      /* list error is enough */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchNotificationAdminCampaigns(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onExport() {
    setExporting(true);
    try {
      const data = await exportNotificationAdminCsv({
        search: filters.search,
        status: filters.status,
        type: filters.type,
      });
      downloadCsvFile(data.filename, data.csv);
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="page">
      <PageHeader
        title="Delivery Reports"
        description="Campaign delivery: total, delivered, opened, failed, and click rate."
      />

      <div className="payment-stats" role="group" aria-label="Notification summary">
        <div className="payment-stat">
          <span className="payment-stat-label">Total Notifications</span>
          <strong className="payment-stat-value">
            {stats?.total_notifications ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Delivered</span>
          <strong className="payment-stat-value">{stats?.delivered ?? '—'}</strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Opened</span>
          <strong className="payment-stat-value">{stats?.opened ?? '—'}</strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Failed</span>
          <strong className="payment-stat-value">{stats?.failed ?? '—'}</strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Click Rate</span>
          <strong className="payment-stat-value">
            {stats ? `${stats.click_rate_percent}%` : '—'}
          </strong>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search title or body…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search notifications"
        />
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as NotificationDashboardFilters['status'],
              page: 1,
            }))
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filters.type ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              type: e.target.value as NotificationDashboardFilters['type'],
              page: 1,
            }))
          }
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="general">General</option>
          <option value="live_class">Live class</option>
          <option value="course_update">Course update</option>
          <option value="test_reminder">Test reminder</option>
          <option value="announcement">Announcement</option>
        </select>
        <button
          type="button"
          className="btn ghost"
          disabled={exporting}
          onClick={() => void onExport()}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <p className="hint">No notification campaigns match these filters.</p>
      ) : null}

      {items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Delivered</th>
                <th>Opened</th>
                <th>Failed</th>
                <th>Click %</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    <div className="hint" style={{ margin: 0 }}>
                      {row.audience_type.replace(/_/g, ' ')} · targets{' '}
                      {row.target_user_count}
                    </div>
                  </td>
                  <td>{row.notification_type.replace(/_/g, ' ')}</td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>{row.status}</span>
                  </td>
                  <td>{row.delivered}</td>
                  <td>{row.opened}</td>
                  <td>{row.failed}</td>
                  <td>{row.click_rate_percent}%</td>
                  <td>{formatWhen(row.sent_at ?? row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="toolbar" style={{ marginTop: '1rem' }}>
          <p className="hint" style={{ margin: 0, flex: 1 }}>
            Showing {from}–{to} of {total}
          </p>
          <button
            type="button"
            className="btn ghost"
            disabled={page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: page - 1 }))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={to >= total}
            onClick={() => setFilters((prev) => ({ ...prev, page: page + 1 }))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
