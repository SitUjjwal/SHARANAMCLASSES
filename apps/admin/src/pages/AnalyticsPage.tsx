/**
 * Admin Analytics — platform-wide Test Series stats.
 */
import { useCallback, useEffect, useState } from 'react';

import type { StudentTestAnalytics } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { fetchAdminAnalytics } from '@/features/admin-insights/api';
import { ApiClientError } from '@/services/api';

export function AnalyticsPage() {
  const [data, setData] = useState<StudentTestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAdminAnalytics());
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to load analytics',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        description="Average score, pass rate, strong/weak subjects, and recent activity."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {data ? (
        <>
          <div className="dashboard-grid" style={{ marginBottom: 24 }}>
            <div className="dashboard-tile">
              <strong>{data.summary.average_score}%</strong>
              <span>Average score</span>
            </div>
            <div className="dashboard-tile">
              <strong>{data.summary.total_tests}</strong>
              <span>Total tests taken</span>
            </div>
            <div className="dashboard-tile">
              <strong>{data.summary.total_attempts}</strong>
              <span>Total attempts</span>
            </div>
            <div className="dashboard-tile">
              <strong>{data.summary.pass_percentage}%</strong>
              <span>Pass percentage</span>
            </div>
          </div>

          <div className="data-table-wrap" style={{ marginBottom: 24 }}>
            <h3>Strong subjects</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Avg %</th>
                  <th>Attempts</th>
                  <th>Pass %</th>
                </tr>
              </thead>
              <tbody>
                {data.strong_subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No data
                    </td>
                  </tr>
                ) : (
                  data.strong_subjects.map((s) => (
                    <tr key={`s-${s.subject}`}>
                      <td>{s.subject}</td>
                      <td>{s.average_percentage}%</td>
                      <td>{s.attempts}</td>
                      <td>{s.pass_percent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="data-table-wrap" style={{ marginBottom: 24 }}>
            <h3>Weak subjects</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Avg %</th>
                  <th>Attempts</th>
                  <th>Pass %</th>
                </tr>
              </thead>
              <tbody>
                {data.weak_subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No data
                    </td>
                  </tr>
                ) : (
                  data.weak_subjects.map((s) => (
                    <tr key={`w-${s.subject}`}>
                      <td>{s.subject}</td>
                      <td>{s.average_percentage}%</td>
                      <td>{s.attempts}</td>
                      <td>{s.pass_percent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="data-table-wrap">
            <h3>Recent activity</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Subject</th>
                  <th>%</th>
                  <th>Result</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No recent attempts
                    </td>
                  </tr>
                ) : (
                  data.recent_activity.map((a) => (
                    <tr key={a.attempt_id}>
                      <td>{a.test_title}</td>
                      <td>{a.subject}</td>
                      <td>{a.percentage}%</td>
                      <td>{a.is_passed ? 'Pass' : 'Fail'}</td>
                      <td>{new Date(a.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
