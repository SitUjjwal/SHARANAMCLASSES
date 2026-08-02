/**
 * Testimonials — feature approved course reviews for marketing.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import {
  listAdminReviews,
  listAdminTestimonials,
  setReviewTestimonial,
} from '@/features/reviews/api';
import { ApiClientError } from '@/services/api';
import type { AdminCourseReview } from '@sharanam/shared';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

function stars(n: number): string {
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n})`;
}

export function TestimonialsPage() {
  const [featured, setFeatured] = useState<AdminCourseReview[]>([]);
  const [approved, setApproved] = useState<AdminCourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, a] = await Promise.all([
        listAdminTestimonials(),
        listAdminReviews({ status: 'approved' }),
      ]);
      setFeatured(t);
      setApproved(a);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approved
      .filter((r) => !r.is_testimonial)
      .filter((r) => {
        if (!q) return true;
        return (
          r.author_name.toLowerCase().includes(q) ||
          (r.student_email ?? '').toLowerCase().includes(q) ||
          (r.course_title ?? '').toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
        );
      });
  }, [approved, search]);

  async function toggle(id: string, next: boolean) {
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
        title="Testimonials"
        description="Feature approved student reviews for website and marketing. Only approved reviews can be testimonials."
      />

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search approved reviews to feature…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search approved reviews"
        />
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
        <Link className="btn" to="/reviews">
          Open Reviews
        </Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      <h2 style={{ marginTop: 8, fontSize: '1.05rem' }}>
        Featured ({featured.length})
      </h2>
      {!loading && featured.length === 0 ? (
        <p className="hint">No testimonials yet — feature an approved review below.</p>
      ) : null}

      {featured.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>{item.author_name}</div>
                    <div className="hint">{item.student_email || '—'}</div>
                  </td>
                  <td>{item.course_title || '—'}</td>
                  <td>{stars(item.rating)}</td>
                  <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{item.comment}</td>
                  <td>{formatDate(item.approved_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn"
                      disabled={busyId === item.id}
                      onClick={() => void toggle(item.id, false)}
                    >
                      Unfeature
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <h2 style={{ marginTop: 24, fontSize: '1.05rem' }}>
        Approved (not featured) ({candidates.length})
      </h2>
      {!loading && candidates.length === 0 ? (
        <p className="hint">No matching approved reviews to feature.</p>
      ) : null}

      {candidates.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>{item.author_name}</div>
                    <div className="hint">{item.student_email || '—'}</div>
                  </td>
                  <td>{item.course_title || '—'}</td>
                  <td>{stars(item.rating)}</td>
                  <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{item.comment}</td>
                  <td>{formatDate(item.approved_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId === item.id}
                      onClick={() => void toggle(item.id, true)}
                    >
                      Feature
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
