/**
 * TeacherDetailPanel — stats + assign courses / live classes.
 */
import { useCallback, useEffect, useState } from 'react';

import type {
  AdminTeacher,
  AdminTeacherCourse,
  AdminTeacherDetail,
  AdminTeacherLiveClass,
} from '@sharanam/shared';

import {
  assignTeacherCourses,
  assignTeacherLiveClasses,
  fetchAdminTeacherDetail,
  fetchAssignableCourses,
  fetchAssignableLiveClasses,
} from '@/features/teachers/api';
import { ApiClientError } from '@/services/api';

type Tab = 'stats' | 'courses' | 'live';

type Props = {
  teacherId: string;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (teacher: AdminTeacher) => void;
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TeacherDetailPanel({
  teacherId,
  onClose,
  onChanged,
  onEdit,
}: Props) {
  const [tab, setTab] = useState<Tab>('stats');
  const [detail, setDetail] = useState<AdminTeacherDetail | null>(null);
  const [assignableCourses, setAssignableCourses] = useState<AdminTeacherCourse[]>([]);
  const [assignableLives, setAssignableLives] = useState<AdminTeacherLiveClass[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedLives, setSelectedLives] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminTeacherDetail(teacherId);
      setDetail(data);
      setSelectedCourses(new Set(data.courses.map((c) => c.id)));
      setSelectedLives(new Set(data.live_classes.map((l) => l.id)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load teacher');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    let cancelled = false;

    const loadAssignable = async () => {
      try {
        if (tab === 'courses') {
          const rows = await fetchAssignableCourses(teacherId);
          if (!cancelled) setAssignableCourses(rows);
        } else if (tab === 'live') {
          const rows = await fetchAssignableLiveClasses(teacherId);
          if (!cancelled) setAssignableLives(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load options');
        }
      }
    };

    void loadAssignable();
    return () => {
      cancelled = true;
    };
  }, [tab, detail, teacherId]);

  const toggle = (set: Set<string>, id: string, on: boolean): Set<string> => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };

  const saveCourses = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignTeacherCourses(teacherId, [...selectedCourses]);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveLives = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignTeacherLiveClasses(teacherId, [...selectedLives]);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const teacher = detail?.teacher;
  const stats = detail?.stats;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel teacher-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Teacher details"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="student-detail-header">
          <div>
            <h2>{teacher?.full_name ?? 'Teacher'}</h2>
            <p className="hint">
              {teacher?.email} · {teacher?.role}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {error ? <p className="form-error">{error}</p> : null}
        {loading ? <p className="hint">Loading…</p> : null}

        {teacher ? (
          <>
            <div className="student-detail-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => onEdit(teacher)}
              >
                Edit
              </button>
            </div>

            <nav className="student-detail-tabs" aria-label="Teacher sections">
              {(
                [
                  ['stats', 'Statistics'],
                  ['courses', 'Assign courses'],
                  ['live', 'Assign live classes'],
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

            {tab === 'stats' && stats ? (
              <div className="dash-kpi-grid teacher-stats-grid">
                <div className="dash-card">
                  <span className="dash-card-label">Courses</span>
                  <strong className="dash-card-value">{stats.courses_assigned}</strong>
                  <span className="dash-card-hint">
                    {stats.courses_published} published
                  </span>
                </div>
                <div className="dash-card">
                  <span className="dash-card-label">Enrollments</span>
                  <strong className="dash-card-value">{stats.total_enrollments}</strong>
                </div>
                <div className="dash-card">
                  <span className="dash-card-label">Live classes</span>
                  <strong className="dash-card-value">{stats.live_classes_assigned}</strong>
                  <span className="dash-card-hint">
                    {stats.live_classes_upcoming} upcoming · {stats.live_classes_today} today
                  </span>
                </div>
                <div className="dash-card">
                  <span className="dash-card-label">Feedback</span>
                  <strong className="dash-card-value">{stats.feedback_count}</strong>
                </div>
              </div>
            ) : null}

            {tab === 'courses' ? (
              <div className="assign-list">
                <p className="hint">
                  Select courses to assign. Unchecking removes this teacher from the course.
                </p>
                {assignableCourses.length === 0 ? (
                  <p className="hint">No assignable courses.</p>
                ) : (
                  <ul className="checkbox-list">
                    {assignableCourses.map((c) => (
                      <li key={c.id}>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={selectedCourses.has(c.id)}
                            onChange={(e) =>
                              setSelectedCourses(
                                toggle(selectedCourses, c.id, e.target.checked),
                              )
                            }
                          />
                          <span>
                            {c.title}
                            {c.is_published ? '' : ' (draft)'}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="btn"
                  disabled={saving}
                  onClick={() => void saveCourses()}
                >
                  {saving ? 'Saving…' : 'Save course assignments'}
                </button>
              </div>
            ) : null}

            {tab === 'live' ? (
              <div className="assign-list">
                <p className="hint">
                  Select live classes to assign to this teacher.
                </p>
                {assignableLives.length === 0 ? (
                  <p className="hint">No assignable live classes.</p>
                ) : (
                  <ul className="checkbox-list">
                    {assignableLives.map((l) => (
                      <li key={l.id}>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={selectedLives.has(l.id)}
                            onChange={(e) =>
                              setSelectedLives(
                                toggle(selectedLives, l.id, e.target.checked),
                              )
                            }
                          />
                          <span>
                            {l.title}
                            <span className="hint"> · {formatDate(l.start_time)}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="btn"
                  disabled={saving}
                  onClick={() => void saveLives()}
                >
                  {saving ? 'Saving…' : 'Save live class assignments'}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
