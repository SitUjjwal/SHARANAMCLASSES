/**
 * Certificates admin — approve / reject / edit (regenerate PDF).
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { CertificateEditForm } from '@/features/certificates/CertificateEditForm';
import {
  approveCertificate,
  listAdminCertificates,
  rejectCertificate,
} from '@/features/certificates/api';
import { ApiClientError } from '@/services/api';
import type { AdminCertificate, CertificateStatus } from '@sharanam/shared';

const FILTERS: Array<{ label: string; value: CertificateStatus | 'all' }> = [
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Issued', value: 'issued' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function CertificatesPage() {
  const [filter, setFilter] = useState<CertificateStatus | 'all'>('pending_approval');
  const [items, setItems] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCertificate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      setItems(await listAdminCertificates(status));
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onApprove(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const cert = await approveCertificate(id);
      setMessage(`Issued ${cert.certificate_number}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    const reason = window.prompt('Rejection reason (optional)') ?? undefined;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await rejectCertificate(id, reason || undefined);
      setMessage('Certificate rejected');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Certificates"
        description="Approve, reject, or edit course-completion certificates. Edit can regenerate the PDF."
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

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="hint">No certificates in this filter.</p>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Status</th>
              <th>Number</th>
              <th>Requested</th>
              <th>Issued</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div>{item.student_name || '—'}</div>
                  <div className="hint">{item.student_email}</div>
                </td>
                <td>{item.course_title ?? item.title}</td>
                <td>{item.status}</td>
                <td>{item.certificate_number ?? '—'}</td>
                <td>{formatDate(item.requested_at)}</td>
                <td>{formatDate(item.issued_at)}</td>
                <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={busyId === item.id}
                    onClick={() => setEditing(item)}
                  >
                    Edit
                  </button>
                  {item.status === 'pending_approval' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => void onApprove(item.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() => void onReject(item.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {item.certificate_url ? (
                    <a
                      className="btn"
                      href={item.certificate_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setEditing(null)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Edit certificate"
            onClick={(e) => e.stopPropagation()}
          >
            <CertificateEditForm
              certificate={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                setMessage('Certificate updated');
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
