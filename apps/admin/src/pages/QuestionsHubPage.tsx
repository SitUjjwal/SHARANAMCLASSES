/**
 * Questions hub — pick a test, then open its question bank.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Test } from '@sharanam/shared';
import { TEST_TYPE_LABELS } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { fetchAdminTests } from '@/features/tests/api';
import { ApiClientError } from '@/services/api';

export function QuestionsHubPage() {
  const [items, setItems] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminTests({
        search: search.trim(),
        page: 1,
        pageSize: 50,
        testType: 'all',
        access: 'all',
        status: 'all',
      });
      setItems(page.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to load tests',
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <div className="page">
      <PageHeader
        title="Questions"
        description="Select a test to manage its MCQ bank, marks, and Excel import."
        actions={
          <Link className="btn primary" to="/tests">
            + Create Test
          </Link>
        }
      />

      <div className="toolbar">
        <input
          className="toolbar-search"
          placeholder="Search tests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <div className="placeholder-panel" style={{ textAlign: 'center' }}>
          <h2>No tests found</h2>
          <p>Create a test first, then come back to add questions.</p>
          <Link className="btn primary" to="/tests" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Go to Tests
          </Link>
        </div>
      ) : (
        <div className="data-table-wrap table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Type</th>
                <th>Course</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((test) => (
                <tr key={test.id}>
                  <td>
                    <strong>{test.title}</strong>
                  </td>
                  <td>{TEST_TYPE_LABELS[test.test_type]}</td>
                  <td>{test.course_title ?? '—'}</td>
                  <td>
                    <Link className="btn primary" to={`/tests/${test.id}/questions`}>
                      Manage questions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
