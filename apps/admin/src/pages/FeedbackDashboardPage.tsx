/**
 * Admin Feedback Dashboard — KPIs, category tabs, search, filters, CSV export.
 *
 * Aggregates: pending/approved reviews, bug reports, support tickets,
 * feature requests (suggestions), and support chat threads.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  FeedbackDashboardCategory,
  FeedbackDashboardItem,
  FeedbackDashboardStats,
} from '@sharanam/shared';
import { FEEDBACK_DASHBOARD_CATEGORY_LABELS } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  downloadCsvFile,
  exportFeedbackDashboardCsv,
  fetchFeedbackDashboardItems,
  fetchFeedbackDashboardStats,
  type FeedbackDashboardFilters,
} from '@/features/feedback-dashboard/api';
import { ApiClientError } from '@/services/api';

const CATEGORY_TABS: FeedbackDashboardCategory[] = [
  'all',
  'pending_reviews',
  'approved_reviews',
  'bug_reports',
  'support_tickets',
  'feature_requests',
  'support_chat',
];

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadgeClass(status: string): string {
  if (status === 'approved' || status === 'resolved' || status === 'closed') {
    return 'badge badge-active';
  }
  if (status === 'rejected' || status === 'failed') {
    return 'badge badge-failed';
  }
  if (
    status === 'pending_approval' ||
    status === 'open' ||
    status === 'in_progress'
  ) {
    return 'badge badge-pending';
  }
  return 'badge badge-inactive';
}

function statusOptionsFor(category: FeedbackDashboardCategory): Array<{
  value: string;
  label: string;
}> {
  if (category === 'pending_reviews' || category === 'approved_reviews') {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'pending_approval', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ];
  }
  if (category === 'support_chat') {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ];
  }
  return [
    { value: 'all', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];
}

export function FeedbackDashboardPage() {
  const [stats, setStats] = useState<FeedbackDashboardStats | null>(null);
  const [filters, setFilters] = useState<FeedbackDashboardFilters>({
    category: 'all',
    status: 'all',
    search: '',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<FeedbackDashboardItem[]>([]);
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
      setStats(await fetchFeedbackDashboardStats());
    } catch {
      /* list error surfaces enough */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchFeedbackDashboardItems(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load feedback dashboard');
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
      const data = await exportFeedbackDashboardCsv({
        category: filters.category,
        status: filters.status,
        search: filters.search,
      });
      downloadCsvFile(data.filename, data.csv);
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const category = filters.category ?? 'all';
  const statusChoices = useMemo(() => statusOptionsFor(category), [category]);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <PageHeader
        title="Feedback Dashboard"
        description="Unified inbox for reviews, bugs, support tickets, feature requests, and chat — with analytics and CSV export."
      />

      <div className="payment-stats" role="group" aria-label="Feedback analytics">
        <div className="payment-stat">
          <span className="payment-stat-label">Pending Reviews</span>
          <strong className="payment-stat-value">
            {stats?.pending_reviews ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Approved Reviews</span>
          <strong className="payment-stat-value">
            {stats?.approved_reviews ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Bug Reports (open)</span>
          <strong className="payment-stat-value">
            {stats?.bug_reports_open ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Support Tickets (open)</span>
          <strong className="payment-stat-value">
            {stats?.support_tickets_open ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Feature Requests (open)</span>
          <strong className="payment-stat-value">
            {stats?.feature_requests_open ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Chats needing reply</span>
          <strong className="payment-stat-value">
            {stats?.support_chats_unread ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Submitted (7d)</span>
          <strong className="payment-stat-value">
            {stats?.submitted_last_7_days ?? '—'}
          </strong>
        </div>
        <div className="payment-stat">
          <span className="payment-stat-label">Resolved (7d)</span>
          <strong className="payment-stat-value">
            {stats?.resolved_last_7_days ?? '—'}
          </strong>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={category === tab ? 'btn btn-primary' : 'btn'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                category: tab,
                status: 'all',
                page: 1,
              }))
            }
          >
            {FEEDBACK_DASHBOARD_CATEGORY_LABELS[tab]}
            {tab === 'pending_reviews' && stats
              ? ` (${stats.pending_reviews})`
              : null}
            {tab === 'bug_reports' && stats ? ` (${stats.bug_reports_open})` : null}
            {tab === 'support_tickets' && stats
              ? ` (${stats.support_tickets_open})`
              : null}
            {tab === 'feature_requests' && stats
              ? ` (${stats.feature_requests_open})`
              : null}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search ticket, student, title, detail…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search feedback inbox"
        />
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value,
              page: 1,
            }))
          }
          aria-label="Filter by status"
        >
          {statusChoices.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void loadStats();
            void load();
          }}
          disabled={loading}
        >
          Refresh
        </button>
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
        <p className="hint">No items match these filters.</p>
      ) : null}

      {items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Category</th>
                <th>Student</th>
                <th>Title</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.source}-${row.id}`}>
                  <td>
                    <code>{row.ref}</code>
                  </td>
                  <td>{FEEDBACK_DASHBOARD_CATEGORY_LABELS[row.category]}</td>
                  <td>
                    <div>{row.student_name}</div>
                    <div className="hint" style={{ margin: 0 }}>
                      {row.student_email || '—'}
                    </div>
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    <strong>{row.title}</strong>
                    <div className="hint" style={{ margin: 0 }}>
                      {row.detail.slice(0, 140)}
                      {row.detail.length > 140 ? '…' : ''}
                    </div>
                  </td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{formatWhen(row.created_at)}</td>
                  <td>
                    <Link className="btn" to={row.admin_path}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <span className="hint">
            Showing {from}–{to} of {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              disabled={page <= 1 || loading}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(1, page - 1) }))
              }
            >
              Previous
            </button>
            <span className="hint">
              Page {page} / {pageCount}
            </span>
            <button
              type="button"
              className="btn"
              disabled={page >= pageCount || loading}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: page + 1 }))
              }
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <p className="hint" style={{ marginTop: 12 }}>
        Detail workflows stay on dedicated pages: Reviews, Student Feedback, Bug
        Reports, Chat Support. Content reports open count:{' '}
        {stats?.content_reports_open ?? '—'} (
        <Link to="/content-reports">Content Reports</Link>).
      </p>
    </div>
  );
}
