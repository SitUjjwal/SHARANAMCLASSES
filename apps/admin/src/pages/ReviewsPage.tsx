/**
 * Course reviews moderation — approve / reject student ratings.
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import {
  approveReview,
  listAdminReviews,
  rejectReview,
  setReviewTestimonial,
} from '@/features/reviews/api';
import { ApiClientError } from '@/services/api';
import type { AdminCourseReview, CourseReviewStatus } from '@sharanam/shared';

const FILTERS: Array<{ label: string; value: CourseReviewStatus | 'all' }> = [
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

function stars(n: number): string {
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n})`;
}

export function ReviewsPage() {
  const [filter, setFilter] = useState<CourseReviewStatus | 'all'>('pending_approval');
  const [items, setItems] = useState<AdminCourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      setItems(await listAdminReviews({ status }));
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load reviews');
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
      await approveReview(id);
      setMessage('Review approved — course average updated');
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
      await rejectReview(id, reason || undefined);
      setMessage('Review rejected');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleTestimonial(id: string, next: boolean) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await setReviewTestimonial(id, next);
      setMessage(next ? 'Added to testimonials' : 'Removed from testimonials');
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
        title="Reviews"
        description="Approve or reject student ratings. Only approved reviews count toward the course average."
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
        <p className="hint">No reviews in this filter.</p>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div>{item.author_name || '—'}</div>
                  <div className="hint">{item.student_email}</div>
                </td>
                <td>{item.course_title ?? '—'}</td>
                <td>{stars(item.rating)}</td>
                <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{item.comment}</td>
                <td>
                  <code>{item.status}</code>
                  {item.rejection_reason ? (
                    <div className="hint">{item.rejection_reason}</div>
                  ) : null}
                </td>
                <td>{formatDate(item.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.status !== 'approved' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => void onApprove(item.id)}
                      >
                        Approve
                      </button>
                    ) : null}
                    {item.status === 'approved' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() =>
                          void onToggleTestimonial(item.id, !item.is_testimonial)
                        }
                      >
                        {item.is_testimonial ? 'Unfeature' : 'Feature'}
                      </button>
                    ) : null}
                    {item.status !== 'rejected' ? (
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === item.id}
                        onClick={() => void onReject(item.id)}
                      >
                        Reject
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
