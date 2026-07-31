/**
 * Notes Management — CRUD, course/chapter assign, HTTPS notes URL.
 */
import { useCallback, useEffect, useState } from 'react';

import type { CourseSummary, Note } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { NoteForm } from '@/features/notes/NoteForm';
import {
  deleteAdminNote,
  fetchAdminNotes,
  fetchCoursesForNotePicker,
  type NoteFilters,
} from '@/features/notes/api';
import { ApiClientError } from '@/services/api';

export function NotesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [filters, setFilters] = useState<NoteFilters>({
    search: '',
    access: 'all',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  useEffect(() => {
    void fetchCoursesForNotePicker()
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
      const page = await fetchAdminNotes(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load notes');
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

  function openEdit(note: Note) {
    setEditing(note);
    setEditorOpen(true);
  }

  async function onDelete(note: Note) {
    const ok = window.confirm(`Delete note “${note.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminNote(note.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  return (
    <div className="page">
      <PageHeader
        title="Notes"
        description="Paste an HTTPS notes link and assign it to a course chapter. Only the URL is stored in PostgreSQL."
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
              access: e.target.value as NoteFilters['access'],
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
              status: e.target.value as NoteFilters['status'],
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
          + Create Note
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">No notes yet. Create one and paste an HTTPS notes URL.</p>
      ) : null}

      <div className="video-admin-list">
        {items.map((note) => (
          <article key={note.id} className="video-admin-card">
            <div className="video-admin-thumb video-admin-thumb-empty" aria-hidden>
              NOTE
            </div>
            <div className="video-admin-meta">
              <strong>{note.title}</strong>
              <span>
                {note.course_title ?? 'Course'} · {note.chapter_title ?? 'Chapter'} ·{' '}
                {note.is_free ? 'Free' : 'Paid'} · order {note.sort_order}
                {!note.is_published ? ' · Draft' : ''}
              </span>
              <span className="banner-admin-link">{note.notes_url}</span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => openEdit(note)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(note)}
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
            Page {filters.page ?? 1} / {totalPages} ({total} notes)
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
            <NoteForm
              note={editing}
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
