/**
 * Student feedback tickets — admin status tracking.
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { listAdminFeedback, updateAdminFeedback, deleteAdminFeedback } from '@/features/feedback/api';
import { ApiClientError } from '@/services/api';
import type {
  AdminFeedbackTicket,
  FeedbackTicketStatus,
  FeedbackType,
} from '@sharanam/shared';
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TYPE_LABELS,
} from '@sharanam/shared';

const STATUS_FILTERS: Array<{ label: string; value: FeedbackTicketStatus | 'all' }> = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
];

const TYPE_FILTERS: Array<{ label: string; value: FeedbackType | 'all' }> = [
  { label: 'All types', value: 'all' },
  { label: 'General', value: 'general' },
  { label: 'Course', value: 'course' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'Complaint', value: 'complaint' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function FeedbackTicketsPage() {
  const [statusFilter, setStatusFilter] = useState<FeedbackTicketStatus | 'all'>('open');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [items, setItems] = useState<AdminFeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await listAdminFeedback({
          status: statusFilter === 'all' ? undefined : statusFilter,
          feedback_type: typeFilter === 'all' ? undefined : typeFilter,
        }),
      );
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: FeedbackTicketStatus) {
    const note =
      status === 'resolved' || status === 'closed'
        ? window.prompt('Admin note (optional)') ?? undefined
        : undefined;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await updateAdminFeedback(id, {
        status,
        admin_note: note || undefined,
      });
      setMessage(`Marked as ${FEEDBACK_STATUS_LABELS[status]}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string, ticketNumber: string) {
    if (!window.confirm(`Delete ticket ${ticketNumber}? This cannot be undone.`)) {
      return;
    }
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await deleteAdminFeedback(id);
      setMessage(`Deleted ${ticketNumber}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Student Feedback"
        description="Track and resolve student feedback tickets (general, course, teacher, suggestion, complaint)."
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
      {!loading && items.length === 0 ? <p className="hint">No tickets in this filter.</p> : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Student</th>
              <th>Type</th>
              <th>Title</th>
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
                <td>{FEEDBACK_TYPE_LABELS[item.feedback_type]}</td>
                <td style={{ maxWidth: 280 }}>
                  <div>{item.title}</div>
                  <div className="hint" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.message.slice(0, 160)}
                    {item.message.length > 160 ? '…' : ''}
                  </div>
                  {item.course_title ? (
                    <div className="hint">Course: {item.course_title}</div>
                  ) : null}
                  {item.teacher_name ? (
                    <div className="hint">Teacher: {item.teacher_name}</div>
                  ) : null}
                  {item.admin_note ? (
                    <div className="hint">Note: {item.admin_note}</div>
                  ) : null}
                </td>
                <td>{FEEDBACK_STATUS_LABELS[item.status]}</td>
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
                    <button
                      type="button"
                      className="btn"
                      disabled={busyId === item.id}
                      onClick={() => void onDelete(item.id, item.ticket_number)}
                    >
                      Delete
                    </button>
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
