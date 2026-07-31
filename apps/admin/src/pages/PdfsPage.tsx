/**
 * PDF Management — CRUD, course/chapter assign, Cloudflare R2 upload.
 */
import { useCallback, useEffect, useState } from 'react';

import type { CourseSummary, Pdf } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { PdfForm } from '@/features/pdfs/PdfForm';
import {
  deleteAdminPdf,
  fetchAdminPdfs,
  fetchCoursesForPdfPicker,
  formatFileSize,
  type PdfFilters,
} from '@/features/pdfs/api';
import { ApiClientError } from '@/services/api';

export function PdfsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [filters, setFilters] = useState<PdfFilters>({
    search: '',
    access: 'all',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<Pdf[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Pdf | null>(null);

  useEffect(() => {
    void fetchCoursesForPdfPicker()
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
      const page = await fetchAdminPdfs(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load PDFs');
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

  function openEdit(pdf: Pdf) {
    setEditing(pdf);
    setEditorOpen(true);
  }

  async function onDelete(pdf: Pdf) {
    const ok = window.confirm(`Delete PDF “${pdf.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminPdf(pdf.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  return (
    <div className="page">
      <PageHeader
        title="PDFs"
        description="Upload PDFs to Cloudflare R2, then assign them to a course chapter. Only the URL is stored in PostgreSQL."
      />

      <div className="toolbar">
        <select
          value={filters.courseId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              courseId: e.target.value || undefined,
              chapterId: undefined,
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
          value={filters.access ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              access: e.target.value as PdfFilters['access'],
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
              status: e.target.value as PdfFilters['status'],
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
        <button type="button" className="btn primary" onClick={openCreate}>
          + Create PDF
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">No PDFs yet. Create one and upload a PDF file.</p>
      ) : null}

      <div className="video-admin-list">
        {items.map((pdf) => (
          <article key={pdf.id} className="video-admin-card">
            <div className="video-admin-thumb video-admin-thumb-empty" aria-hidden>
              PDF
            </div>
            <div className="video-admin-meta">
              <strong>{pdf.title}</strong>
              <span>
                {pdf.course_title ?? 'Course'} · {pdf.chapter_title ?? 'Chapter'} ·{' '}
                {pdf.is_free ? 'Free' : 'Paid'} · {formatFileSize(pdf.file_size)} · order{' '}
                {pdf.sort_order}
                {!pdf.is_published ? ' · Draft' : ''}
              </span>
              <span className="banner-admin-link">{pdf.file_url}</span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => openEdit(pdf)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(pdf)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
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
            Page {filters.page ?? 1} / {totalPages} ({total} PDFs)
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
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <PdfForm
              pdf={editing}
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
