/**
 * Payment Management — KPIs, searchable orders, CSV export.
 */
import { useCallback, useEffect, useState } from 'react';

import type { PaymentAdminOrder, PaymentAdminStats } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  downloadCsvFile,
  exportAdminPaymentsCsv,
  fetchAdminPaymentStats,
  fetchAdminPayments,
  type PaymentFilters,
} from '@/features/payments/api';
import { ApiClientError } from '@/services/api';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadgeClass(status: PaymentAdminOrder['status']): string {
  if (status === 'paid') return 'badge badge-active';
  if (status === 'failed') return 'badge badge-failed';
  if (status === 'created') return 'badge badge-pending';
  return 'badge badge-inactive';
}

export function PaymentsPage() {
  const [stats, setStats] = useState<PaymentAdminStats | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<PaymentAdminOrder[]>([]);
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
      const data = await fetchAdminPaymentStats();
      setStats(data);
    } catch {
      /* list error surface is enough */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminPayments(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load payments');
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
      const data = await exportAdminPaymentsCsv({
        search: filters.search,
        status: filters.status,
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
        title="Payments"
        description="Track course purchases, revenue, and payment status."
      />

      <div className="payment-stats" role="group" aria-label="Payment summary">
        <div className="payment-stat">
          <span className="payment-stat-label">Today&apos;s Revenue</span>
          <strong className="payment-stat-value">
            {stats?.today_revenue_display ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Orders</span>
          <strong className="payment-stat-value">{stats?.total_orders ?? '—'}</strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Successful</span>
          <strong className="payment-stat-value">{stats?.paid_orders ?? '—'}</strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Failed</span>
          <strong className="payment-stat-value">{stats?.failed_payments ?? '—'}</strong>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search course, email, payment ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search payments"
        />
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as PaymentFilters['status'],
              page: 1,
            }))
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
          <option value="expired">Expired</option>
        </select>
        <button type="button" className="btn primary" disabled={exporting} onClick={() => void onExport()}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>No payment orders found.</td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.order_id}>
                  <td>
                    <div className="course-cell">
                      <span>{row.course_title}</span>
                      <small>{row.receipt_number}</small>
                    </div>
                  </td>
                  <td>{row.student_email ?? row.user_id.slice(0, 8)}</td>
                  <td>{row.amount_display}</td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>{row.status}</span>
                  </td>
                  <td>
                    <code className="mono-cell">{row.payment_id ?? '—'}</code>
                  </td>
                  <td>{formatWhen(row.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar" style={{ marginTop: '1rem' }}>
        <div className="pagination">
          <span>
            {total === 0 ? '0 orders' : `${from}–${to} of ${total}`}
          </span>
          <div className="row-actions">
            <button
              type="button"
              className="btn ghost"
              disabled={page <= 1 || loading}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={to >= total || loading}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
