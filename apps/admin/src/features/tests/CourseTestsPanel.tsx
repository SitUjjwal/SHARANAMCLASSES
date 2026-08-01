/**
 * Manage tests assigned to one course — list + create/edit from Courses page.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { CourseSummary, Test } from '@sharanam/shared';
import { TEST_TYPE_LABELS } from '@sharanam/shared';

import { TestForm } from '@/features/tests/TestForm';
import {
  deleteAdminTest,
  fetchAdminTests,
  fetchCoursesForTestPicker,
} from '@/features/tests/api';
import { ApiClientError } from '@/services/api';

type CourseTestsPanelProps = {
  course: CourseSummary;
  onClose: () => void;
};

export function CourseTestsPanel({ course, onClose }: CourseTestsPanelProps) {
  const [items, setItems] = useState<Test[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([course]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminTests({
        courseId: course.id,
        page: 1,
        pageSize: 100,
        status: 'all',
        access: 'all',
        testType: 'all',
      });
      setItems(page.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchCoursesForTestPicker()
      .then((page) => {
        const list = page.items;
        if (!list.some((c) => c.id === course.id)) {
          setCourses([course, ...list]);
        } else {
          setCourses(list);
        }
      })
      .catch(() => {
        setCourses([course]);
      });
  }, [course]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(row: Test) {
    setEditing(row);
    setEditorOpen(true);
  }

  async function onDelete(row: Test) {
    const ok = window.confirm(`Delete test “${row.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminTest(row.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="course-tests-panel">
      <header className="course-form-head">
        <div>
          <h2>Tests · {course.title}</h2>
          <p className="hint" style={{ margin: '0.25rem 0 0' }}>
            Chapter / subject tests for this course
          </p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn primary" onClick={openCreate}>
            + Add Test
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <div className="empty-state">
          <p className="hint">No tests on this course yet.</p>
          <button type="button" className="btn primary" onClick={openCreate}>
            + Add Test
          </button>
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Chapter</th>
                <th>Marks</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    <div>
                      <small>
                        {row.duration_minutes} min · {row.is_free ? 'Free' : 'Paid'}
                      </small>
                    </div>
                  </td>
                  <td>{TEST_TYPE_LABELS[row.test_type]}</td>
                  <td>{row.chapter_title ?? '—'}</td>
                  <td>
                    {row.passing_marks}/{row.total_marks}
                  </td>
                  <td>
                    <span
                      className={
                        row.is_published ? 'badge badge-active' : 'badge badge-inactive'
                      }
                    >
                      {row.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <Link className="btn ghost" to={`/tests/${row.id}/questions`}>
                      Questions
                    </Link>
                    <button type="button" className="btn ghost" onClick={() => openEdit(row)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => void onDelete(row)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editorOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <TestForm
              test={editing}
              courses={courses}
              presetCourseId={course.id}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
