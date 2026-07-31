/**
 * Course Management — list, search, pagination, CRUD.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Category, CourseSummary } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  deleteAdminCourse,
  fetchAdminCategories,
  fetchAdminCourses,
  fetchAdminTeachers,
  type AdminCourseFilters,
  type TeacherOption,
} from '@/features/courses/api';
import { CourseForm } from '@/features/courses/CourseForm';
import { ApiClientError } from '@/services/api';

const PAGE_SIZE = 10;

export function CoursesPage() {
  const [filters, setFilters] = useState<AdminCourseFilters>({
    search: '',
    status: 'all',
    price: 'all',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<CourseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CourseSummary | null>(null);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const loadMeta = useCallback(async () => {
    const cats = await fetchAdminCategories();
    setCategories(cats);

    try {
      const teach = await fetchAdminTeachers();
      setTeachers(teach);
    } catch (err) {
      // Teachers are optional for listing; form still allows typing teacher name.
      setTeachers([]);
      if (err instanceof ApiClientError && err.code === 'FORBIDDEN') {
        setError(
          err.message ||
            'Admin access required. Add your email to ADMIN_EMAILS in apps/api/.env or set profiles.role = admin.',
        );
      }
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchAdminCourses(filters);
      setItems(page.items);
      setTotal(page.total);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load courses');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadMeta().catch((err) => {
      if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
        return;
      }
      setError(err instanceof ApiClientError ? err.message : 'Failed to load lookups');
    });
  }, [loadMeta]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      setFilters((prev) => {
        if (prev.search === nextSearch) return prev;
        return { ...prev, search: nextSearch, page: 1 };
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(course: CourseSummary) {
    setEditing(course);
    setEditorOpen(true);
  }

  async function onDelete(course: CourseSummary) {
    const ok = window.confirm(`Delete “${course.title}”? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteAdminCourse(course.id);
      await loadCourses();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Courses"
        description="Create, update, and publish courses. Active courses appear in the student app."
      />

      <div className="toolbar">
        <input
          className="toolbar-search"
          placeholder="Search title, slug, teacher…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={filters.categoryId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              categoryId: e.target.value || undefined,
              page: 1,
            }))
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as AdminCourseFilters['status'],
              page: 1,
            }))
          }
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filters.price ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              price: e.target.value as AdminCourseFilters['price'],
              page: 1,
            }))
          }
        >
          <option value="all">Free + Paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Create Course
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Category</th>
              <th>Teacher</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : null}
            {!loading && !items.length ? (
              <tr>
                <td colSpan={6}>No courses found.</td>
              </tr>
            ) : null}
            {items.map((course) => (
              <tr key={course.id}>
                <td>
                  <div className="course-cell">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" />
                    ) : (
                      <span className="thumb-fallback">{course.title.slice(0, 1)}</span>
                    )}
                    <div>
                      <strong>{course.title}</strong>
                      <small>{course.slug}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {course.category_id ? categoryMap[course.category_id] ?? '—' : '—'}
                </td>
                <td>{course.teacher_name || '—'}</td>
                <td>{course.is_free ? 'Free' : `₹${Math.round(course.price)}`}</td>
                <td>
                  <span
                    className={
                      course.is_published ? 'badge badge-active' : 'badge badge-inactive'
                    }
                  >
                    {course.is_published ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn ghost" onClick={() => openEdit(course)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => void onDelete(course)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
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
        <span>
          Page {filters.page ?? 1} of {totalPages} · {total} courses
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

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <CourseForm
              course={editing}
              categories={categories}
              teachers={teachers}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void loadCourses();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
