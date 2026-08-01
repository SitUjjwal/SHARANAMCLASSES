/**
 * Admin Leaderboard — Top 100 with optional course / test / date filters.
 */
import { useCallback, useEffect, useState } from 'react';

import type { LeaderboardEntry, Test } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { fetchAdminLeaderboard } from '@/features/admin-insights/api';
import { fetchAdminTests } from '@/features/tests/api';
import { ApiClientError } from '@/services/api';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [testId, setTestId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminTests({ page: 1, pageSize: 100, testType: 'all', access: 'all', status: 'all' })
      .then((page) => setTests(page.items))
      .catch(() => {
        /* picker optional */
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeaderboard({
        testId: testId || undefined,
        date: date || undefined,
        limit: 100,
      });
      setItems(data.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to load leaderboard',
      );
    } finally {
      setLoading(false);
    }
  }, [date, testId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <PageHeader
        title="Leaderboard"
        description="Top 100 students by percentage, score, then time taken."
      />

      <div className="toolbar">
        <select
          className="input"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
        >
          <option value="">All tests</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="button" className="btn" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">No rankings for these filters.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Test</th>
                <th>Score</th>
                <th>%</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.attempt_id}>
                  <td>#{row.rank}</td>
                  <td>{row.student_name}</td>
                  <td>{row.test_title}</td>
                  <td>{row.score}</td>
                  <td>{row.percentage}%</td>
                  <td>{formatTime(row.time_taken_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
