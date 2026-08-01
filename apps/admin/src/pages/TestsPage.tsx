/**
 * Test Series Management — CRUD, course/chapter, duration, marks, type.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { CourseSummary, Test, TestType } from '@sharanam/shared';
import { TEST_TYPE_LABELS } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { TestForm } from '@/features/tests/TestForm';
import {
  deleteAdminTest,
  fetchAdminTests,
  fetchCoursesForTestPicker,
  type TestFilters,
} from '@/features/tests/api';
import { ApiClientError } from '@/services/api';

export function TestsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    testType: 'all',
    access: 'all',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<Test[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);

  useEffect(() => {
    void fetchCoursesForTestPicker()
      .then((page) => setCourses(page.items))
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load courses');
      });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFilters((prev) => {
        const next = searchInput.trim();
        if (prev.search === next) return prev;
        return { ...prev, search: next, page: 1 };
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminTests(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load tests');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  return (
    <div className="page">
      <PageHeader
        title="Tests"
        description="Create chapter, subject, mock, previous-year, and daily quiz tests. Set duration, marks, and course/chapter assignment."
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Create Test
          </button>
        }
      />

      <div className="toolbar">
        <select
          value={filters.courseId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              courseId: e.target.value || undefined,
              page: 1,
            }))
          }
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          value={filters.testType ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              testType: e.target.value as TestFilters['testType'],
              page: 1,
            }))
          }
        >
          <option value="all">All types</option>
          {(Object.keys(TEST_TYPE_LABELS) as TestType[]).map((type) => (
            <option key={type} value={type}>
              {TEST_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          value={filters.access ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              access: e.target.value as TestFilters['access'],
              page: 1,
            }))
          }
        >
          <option value="all">Free + Paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as TestFilters['status'],
              page: 1,
            }))
          }
        >
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <input
          className="toolbar-search"
          placeholder="Search title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <div className="placeholder-panel" style={{ textAlign: 'center' }}>
          <h2>No tests yet</h2>
          <p>Create a Chapter Test, Mock Test, or Daily Quiz to get started.</p>
          <button
            type="button"
            className="btn primary"
            style={{ marginTop: '0.75rem' }}
            onClick={openCreate}
          >
            + Create Test
          </button>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Course / Chapter</th>
              <th>Duration</th>
              <th>Marks</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="course-cell">
                    <span>{row.title}</span>
                    <small>{row.is_free ? 'Free' : 'Paid'}</small>
                  </div>
                </td>
                <td>{TEST_TYPE_LABELS[row.test_type]}</td>
                <td>
                  {row.course_title ?? '—'}
                  {row.chapter_title ? ` · ${row.chapter_title}` : ''}
                </td>
                <td>{row.duration_minutes} min</td>
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
                <td>
                  <div className="row-actions">
                    <Link className="btn ghost" to={`/tests/${row.id}/questions`}>
                      Questions
                    </Link>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => void onDelete(row)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="toolbar" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn ghost"
            disabled={(filters.page ?? 1) <= 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))
            }
          >
            Previous
          </button>
          <span className="hint">
            Page {filters.page ?? 1} / {totalPages} ({total} tests)
          </span>
          <button
            type="button"
            className="btn ghost"
            disabled={(filters.page ?? 1) >= totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
            }
          >
            Next
          </button>
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
