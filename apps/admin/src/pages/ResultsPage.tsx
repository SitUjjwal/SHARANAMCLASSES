/**
 * Admin Results — scored attempts across students.
 */
import { useCallback, useEffect, useState } from 'react';

import type { TestAttemptResultSummary } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { fetchAdminResults } from '@/features/admin-insights/api';
import { ApiClientError } from '@/services/api';

export function ResultsPage() {
  const [items, setItems] = useState<
    Array<TestAttemptResultSummary & { student_name: string }>
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminResults({ page, pageSize: 20 });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load results',
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageSize = 20;
  const hasMore = page * pageSize < total;

  return (
    <div className="page">
      <PageHeader
        title="Results"
        description="Scored test attempts — marks, percentage, and pass/fail."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">No scored attempts yet.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Score</th>
                <th>%</th>
                <th>Pass</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.attempt_id}>
                  <td>{row.student_name}</td>
                  <td>{row.test_title}</td>
                  <td>
                    {row.obtained_marks} / {row.total_marks}
                  </td>
                  <td>{row.percentage}%</td>
                  <td>{row.is_passed ? 'Pass' : 'Fail'}</td>
                  <td>
                    {row.submitted_at
                      ? new Date(row.submitted_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="muted">
          Page {page} · {total} total
        </span>
        <button
          type="button"
          className="btn"
          disabled={!hasMore || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
