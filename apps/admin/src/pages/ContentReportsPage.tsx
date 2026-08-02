/**
 * Content reports admin dashboard.
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import {
  listAdminContentReports,
  updateAdminContentReport,
} from '@/features/content-reports/api';
import { ApiClientError } from '@/services/api';
import type {
  AdminContentReport,
  ContentReportStatus,
  ContentReportType,
} from '@sharanam/shared';
import {
  CONTENT_REPORT_STATUS_LABELS,
  CONTENT_REPORT_TYPE_LABELS,
} from '@sharanam/shared';

const STATUS_FILTERS: Array<{ label: string; value: ContentReportStatus | 'all' }> = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
];

const TYPE_FILTERS: Array<{ label: string; value: ContentReportType | 'all' }> = [
  { label: 'All types', value: 'all' },
  { label: 'Incorrect Video', value: 'incorrect_video' },
  { label: 'Wrong PDF', value: 'wrong_pdf' },
  { label: 'Broken Link', value: 'broken_link' },
  { label: 'Incorrect Question', value: 'incorrect_question' },
  { label: 'Duplicate Content', value: 'duplicate_content' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ContentReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ContentReportStatus | 'all'>('open');
  const [typeFilter, setTypeFilter] = useState<ContentReportType | 'all'>('all');
  const [items, setItems] = useState<AdminContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await listAdminContentReports({
          status: statusFilter === 'all' ? undefined : statusFilter,
          report_type: typeFilter === 'all' ? undefined : typeFilter,
        }),
      );
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load content reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: ContentReportStatus) {
    const note =
      status === 'resolved' || status === 'closed'
        ? window.prompt('Admin note (optional)') ?? undefined
        : undefined;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await updateAdminContentReport(id, {
        status,
        admin_note: note || undefined,
      });
      setMessage(`Marked as ${CONTENT_REPORT_STATUS_LABELS[status]}`);
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
        title="Content Reports"
        description="Student reports for incorrect videos, PDFs, links, questions, and duplicates."
      />

      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={statusFilter === f.value ? 'btn btn-primary' : 'btn'}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={typeFilter === f.value ? 'btn btn-primary' : 'btn'}
            onClick={() => setTypeFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="hint">No content reports in this filter.</p>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Student</th>
              <th>Type</th>
              <th>Target</th>
              <th>Description</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <code>{item.ticket_number}</code>
                </td>
                <td>
                  <div>{item.student_name}</div>
                  <div className="hint">{item.student_email}</div>
                </td>
                <td>{CONTENT_REPORT_TYPE_LABELS[item.report_type]}</td>
                <td>
                  <div>{item.target_label || item.target_type || '—'}</div>
                  {item.course_title ? (
                    <div className="hint">{item.course_title}</div>
                  ) : null}
                  {item.target_id ? (
                    <div className="hint">
                      <code>{item.target_id.slice(0, 8)}…</code>
                    </div>
                  ) : null}
                </td>
                <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                  {item.description}
                  {item.admin_note ? (
                    <div className="hint">Note: {item.admin_note}</div>
                  ) : null}
                </td>
                <td>{CONTENT_REPORT_STATUS_LABELS[item.status]}</td>
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
