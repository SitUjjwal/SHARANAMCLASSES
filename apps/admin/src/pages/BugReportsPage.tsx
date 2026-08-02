/**
 * Bug reports admin — view screenshot + update status + search.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import {
  listAdminBugReports,
  updateAdminBugReport,
} from '@/features/bug-reports/api';
import { ApiClientError } from '@/services/api';
import type { AdminBugReport, BugReportStatus } from '@sharanam/shared';
import { BUG_REPORT_STATUS_LABELS } from '@sharanam/shared';

const FILTERS: Array<{ label: string; value: BugReportStatus | 'all' }> = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function BugReportsPage() {
  const [filter, setFilter] = useState<BugReportStatus | 'all'>('open');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AdminBugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await listAdminBugReports({
          status: filter === 'all' ? undefined : filter,
        }),
      );
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.ticket_number.toLowerCase().includes(q) ||
        item.student_name.toLowerCase().includes(q) ||
        (item.student_email ?? '').toLowerCase().includes(q) ||
        item.screen_label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        BUG_REPORT_STATUS_LABELS[item.status].toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  async function setStatus(id: string, status: BugReportStatus) {
    const note =
      status === 'resolved' || status === 'closed'
        ? window.prompt('Admin reply / note (optional)') ?? undefined
        : undefined;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await updateAdminBugReport(id, { status, admin_note: note || undefined });
      setMessage(`Marked as ${BUG_REPORT_STATUS_LABELS[status]}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Bug Reports"
        description="Student bug reports with optional screenshots. Update status as you investigate."
      />

      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={filter === f.value ? 'btn btn-primary' : 'btn'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search ticket, student, screen, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search bug reports"
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && visible.length === 0 ? (
        <p className="hint">No bug reports match this filter/search.</p>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Student</th>
              <th>Screen</th>
              <th>Description</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  <code>{item.ticket_number}</code>
                </td>
                <td>
                  <div>{item.student_name}</div>
                  <div className="hint">{item.student_email}</div>
                </td>
                <td>{item.screen_label}</td>
                <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                  {item.description}
                  {item.admin_note ? (
                    <div className="hint">Reply: {item.admin_note}</div>
                  ) : null}
                </td>
                <td>
                  {item.screenshot_url ? (
                    <a href={item.screenshot_url} target="_blank" rel="noreferrer">
                      <img
                        src={item.screenshot_url}
                        alt="Screenshot"
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    </a>
                  ) : (
                    <span className="hint">—</span>
                  )}
                </td>
                <td>{BUG_REPORT_STATUS_LABELS[item.status]}</td>
                <td>{formatDate(item.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.status === 'open' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'in_progress')}
                      >
                        Start
                      </button>
                    ) : null}
                    {item.status !== 'resolved' && item.status !== 'closed' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'resolved')}
                      >
                        Resolve
                      </button>
                    ) : null}
                    {item.status !== 'closed' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'closed')}
                      >
                        Close
                      </button>
                    ) : null}
                    {item.status === 'closed' || item.status === 'resolved' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() => void setStatus(item.id, 'open')}
                      >
                        Reopen
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
