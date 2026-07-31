/**
 * ChaptersPage — add/edit/delete, search, drag-and-drop order.
 */
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

import type { Chapter, CourseSummary } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  deleteAdminChapter,
  fetchAdminChapters,
  fetchCoursesForChapterPicker,
  reorderAdminChapters,
} from '@/features/chapters/api';
import { ChapterForm } from '@/features/chapters/ChapterForm';
import { ChapterContentPanel } from '@/features/chapters/ChapterContentPanel';
import { ApiClientError } from '@/services/api';

const ADMIN_HINT =
  "Admin access required. In Supabase SQL Editor run: update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';";

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function explainError(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    return err.code === 'FORBIDDEN' ? ADMIN_HINT : err.message;
  }
  if (err instanceof TypeError) {
    return 'Cannot reach API. Start apps/api with npm run dev (port 4000).';
  }
  return fallback;
}

export function ChaptersPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseId, setCourseId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [contentChapter, setContentChapter] = useState<Chapter | null>(null);

  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  useEffect(() => {
    void fetchCoursesForChapterPicker()
      .then((page) => {
        setCourses(page.items);
        setCourseId((prev) => prev || page.items[0]?.id || '');
      })
      .catch((err) => {
        setError(explainError(err, 'Failed to load courses'));
      });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const loadChapters = useCallback(async () => {
    if (!courseId) {
      setChapters([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminChapters(courseId, search || undefined);
      setChapters(data);
    } catch (err) {
      setError(explainError(err, 'Failed to load chapters'));
    } finally {
      setLoading(false);
    }
  }, [courseId, search]);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(chapter: Chapter) {
    setEditing(chapter);
    setEditorOpen(true);
  }

  async function onDelete(chapter: Chapter) {
    const ok = window.confirm(`Delete “${chapter.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminChapter(chapter.id);
      await loadChapters();
    } catch (err) {
      window.alert(explainError(err, 'Delete failed'));
    }
  }

  async function persistOrder(next: Chapter[]) {
    if (!courseId || search) return;
    setSavingOrder(true);
    try {
      const saved = await reorderAdminChapters(
        courseId,
        next.map((chapter) => chapter.id),
      );
      setChapters(saved);
    } catch (err) {
      window.alert(explainError(err, 'Could not save order'));
      await loadChapters();
    } finally {
      setSavingOrder(false);
    }
  }

  function renumber(list: Chapter[]): Chapter[] {
    return list.map((chapter, i) => ({
      ...chapter,
      chapter_number: i + 1,
    }));
  }

  async function moveChapter(index: number, direction: -1 | 1) {
    if (search || savingOrder) return;
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    const renumbered = renumber(next);
    setChapters(renumbered);
    await persistOrder(renumbered);
  }

  function onDragStart(index: number) {
    if (search) return;
    setDragIndex(index);
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index || search) return;
    setChapters((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      if (!moved) return prev;
      next.splice(index, 0, moved);
      return renumber(next);
    });
    setDragIndex(index);
  }

  async function onDragEnd() {
    if (dragIndex === null || !courseId || search) {
      setDragIndex(null);
      return;
    }
    setDragIndex(null);
    await persistOrder(chaptersRef.current);
  }

  const selectedCourse = courses.find((c) => c.id === courseId);
  const canReorder = !search && !savingOrder;

  return (
    <div className="page">
      <PageHeader
        title="Chapters"
        description="Add, edit, delete, search, and drag chapters to change order for a course."
      />

      <div className="toolbar">
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setSearchInput('');
          }}
        >
          <option value="">Select course…</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <input
          className="toolbar-search"
          placeholder="Search chapters…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={!courseId}
        />
        <button
          type="button"
          className="btn primary"
          disabled={!courseId}
          onClick={openCreate}
        >
          + Add Chapter
        </button>
      </div>

      {search ? (
        <p className="hint">Clear search to enable drag-and-drop reordering.</p>
      ) : null}
      {savingOrder ? <p className="hint">Saving new order…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!courseId ? (
        <p className="hint">Choose a course to manage its chapters.</p>
      ) : (
        <div className="chapter-dnd-list">
          {loading ? <p className="hint">Loading…</p> : null}
          {!loading && !chapters.length ? (
            <p className="hint">No chapters yet for {selectedCourse?.title ?? 'this course'}.</p>
          ) : null}
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`chapter-dnd-row${dragIndex === index ? ' is-dragging' : ''}`}
              draggable={canReorder}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={() => void onDragEnd()}
            >
              <span className="drag-handle" title="Drag to reorder" aria-hidden>
                ⋮⋮
              </span>
              <div className="chapter-dnd-main">
                <strong>
                  Chapter {chapter.chapter_number} · {chapter.title}
                </strong>
                <span>
                  {formatDuration(chapter.duration_seconds)} · {chapter.video_count} Videos ·{' '}
                  {chapter.pdf_count} PDFs · {chapter.notes_count} Notes
                  {chapter.is_free_preview ? ' · Free preview' : ''}
                  {!chapter.is_published ? ' · Draft' : ''}
                </span>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={!canReorder || index === 0}
                  onClick={() => void moveChapter(index, -1)}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={!canReorder || index === chapters.length - 1}
                  onClick={() => void moveChapter(index, 1)}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setContentChapter(chapter)}
                >
                  Videos & Notes
                </button>
                <button type="button" className="btn ghost" onClick={() => openEdit(chapter)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => void onDelete(chapter)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen && courseId ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <ChapterForm
              courseId={courseId}
              chapter={editing}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void loadChapters();
              }}
            />
          </div>
        </div>
      ) : null}

      {contentChapter ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setContentChapter(null)}
        >
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <ChapterContentPanel
              chapter={contentChapter}
              onClose={() => setContentChapter(null)}
              onChanged={() => void loadChapters()}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
