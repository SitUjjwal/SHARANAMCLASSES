/**
 * StudentDetailPanel — view student + courses / tests / payments + admin actions.
 */
import { useCallback, useEffect, useState } from 'react';

import type {
  AdminStudent,
  AdminStudentCourse,
  AdminStudentPaymentItem,
  AdminStudentTestHistoryItem,
} from '@sharanam/shared';

import {
  activateAdminStudent,
  fetchAdminStudent,
  fetchAdminStudentCourses,
  fetchAdminStudentPayments,
  fetchAdminStudentTests,
  resetAdminStudentPassword,
  suspendAdminStudent,
} from '@/features/students/api';
import { ApiClientError } from '@/services/api';

type Tab = 'overview' | 'courses' | 'tests' | 'payments';

type Props = {
  studentId: string;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (student: AdminStudent) => void;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function StudentDetailPanel({
  studentId,
  onClose,
  onChanged,
  onEdit,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [student, setStudent] = useState<AdminStudent | null>(null);
  const [courses, setCourses] = useState<AdminStudentCourse[]>([]);
  const [tests, setTests] = useState<AdminStudentTestHistoryItem[]>([]);
  const [payments, setPayments] = useState<AdminStudentPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudent(await fetchAdminStudent(studentId));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load student');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;

    const loadTab = async () => {
      setError(null);
      try {
        if (tab === 'courses') {
          const data = await fetchAdminStudentCourses(studentId);
          if (!cancelled) setCourses(data);
        } else if (tab === 'tests') {
          const data = await fetchAdminStudentTests(studentId);
          if (!cancelled) setTests(data);
        } else if (tab === 'payments') {
          const data = await fetchAdminStudentPayments(studentId);
          if (!cancelled) setPayments(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load tab');
        }
      }
    };

    void loadTab();
    return () => {
      cancelled = true;
    };
  }, [tab, student, studentId]);

  const runAction = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await loadStudent();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel student-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Student details"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="student-detail-header">
          <div>
            <h2>{student?.full_name ?? 'Student'}</h2>
            <p className="hint">{student?.email}</p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {error ? <p className="form-error">{error}</p> : null}
        {loading ? <p className="hint">Loading…</p> : null}

        {student ? (
          <>
            <div className="student-detail-actions">
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => onEdit(student)}
              >
                Edit
              </button>
              {student.is_suspended ? (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      await activateAdminStudent(student.id);
                    })
                  }
                >
                  Activate
                </button>
              ) : (
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => {
                    const reason =
                      window.prompt('Optional suspend reason:') ?? undefined;
                    void runAction(async () => {
                      await suspendAdminStudent(student.id, reason || undefined);
                    });
                  }}
                >
                  Suspend
                </button>
              )}
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Reset password for ${student.email}? A temporary password will be shown once.`,
                    )
                  ) {
                    return;
                  }
                  void runAction(async () => {
                    const result = await resetAdminStudentPassword(student.id);
                    setTempPassword(result.temporary_password);
                  });
                }}
              >
                Reset password
              </button>
            </div>

            {tempPassword ? (
              <div className="student-temp-password">
                <strong>Temporary password</strong>
                <code>{tempPassword}</code>
                <p className="hint">Copy now — it will not be shown again.</p>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(tempPassword);
                  }}
                >
                  Copy
                </button>
              </div>
            ) : null}

            <nav className="student-detail-tabs" aria-label="Student sections">
              {(
                [
                  ['overview', 'Overview'],
                  ['courses', 'Courses'],
                  ['tests', 'Test history'],
                  ['payments', 'Payments'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={tab === key ? 'btn' : 'btn ghost'}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'overview' ? (
              <dl className="student-overview-grid">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={
                        student.is_suspended ? 'status-pill warn' : 'status-pill ok'
                      }
                    >
                      {student.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{student.phone_number || '—'}</dd>
                </div>
                <div>
                  <dt>Class</dt>
                  <dd>{student.class_level || '—'}</dd>
                </div>
                <div>
                  <dt>Medium</dt>
                  <dd>{student.medium || '—'}</dd>
                </div>
                <div>
                  <dt>Enrolled courses</dt>
                  <dd>{student.enrolled_courses}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>{formatDate(student.created_at)}</dd>
                </div>
                {student.is_suspended ? (
                  <>
                    <div>
                      <dt>Suspended at</dt>
                      <dd>{formatDate(student.suspended_at)}</dd>
                    </div>
                    <div>
                      <dt>Reason</dt>
                      <dd>{student.suspended_reason || '—'}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            ) : null}

            {tab === 'courses' ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Progress</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={3}>No purchased / enrolled courses.</td>
                      </tr>
                    ) : (
                      courses.map((c) => (
                        <tr key={c.enrollment_id}>
                          <td>{c.course_title}</td>
                          <td>{c.progress_percent}%</td>
                          <td>{formatDate(c.enrolled_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === 'tests' ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Score</th>
                      <th>%</th>
                      <th>Result</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No test history.</td>
                      </tr>
                    ) : (
                      tests.map((t) => (
                        <tr key={t.attempt_id}>
                          <td>{t.test_title}</td>
                          <td>
                            {t.obtained_marks ?? '—'}
                            {t.total_marks != null ? ` / ${t.total_marks}` : ''}
                          </td>
                          <td>{t.percentage != null ? `${t.percentage}%` : '—'}</td>
                          <td>
                            {t.is_passed == null
                              ? t.status
                              : t.is_passed
                                ? 'Pass'
                                : 'Fail'}
                          </td>
                          <td>{formatDate(t.submitted_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === 'payments' ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No payments.</td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.order_id}>
                          <td>{p.course_title}</td>
                          <td>{p.amount_display}</td>
                          <td>{p.status}</td>
                          <td>{formatDate(p.paid_at ?? p.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
