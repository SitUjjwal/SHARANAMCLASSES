/**
 * Chapters inside one batch subject — list, add, reorder, publish toggle, delete.
 */
import { FormEvent, useCallback, useEffect, useState } from 'react';

import type { BatchSubject, Chapter, CourseSummary } from '@sharanam/shared';

import {
  createBatchSubjectChapter,
  fetchBatchSubjectChapters,
} from '@/features/batches/api';
import {
  deleteAdminChapter,
  reorderAdminChapters,
  updateAdminChapter,
} from '@/features/chapters/api';
import { ApiClientError } from '@/services/api';

type SubjectChaptersPanelProps = {
  batch: CourseSummary;
  batchSubject: BatchSubject;
  onBack: () => void;
  onClose: () => void;
};

export function SubjectChaptersPanel({
  batch,
  batchSubject,
  onBack,
  onClose,
}: SubjectChaptersPanelProps) {
  const [items, setItems] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFreePreview, setNewFreePreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchBatchSubjectChapters(batchSubject.id);
      setItems(rows);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load chapters');
      }
    } finally {
      setLoading(false);
    }
  }, [batchSubject.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (title.length < 2) {
      setError('Chapter title must be at least 2 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createBatchSubjectChapter(batchSubject.id, {
        title,
        description: newDescription.trim() || undefined,
        is_free_preview: newFreePreview,
      });
      setNewTitle('');
      setNewDescription('');
      setNewFreePreview(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add chapter');
    } finally {
      setBusy(false);
    }
  }

  async function onTogglePublished(row: Chapter) {
    setBusy(true);
    try {
      await updateAdminChapter(row.id, { is_published: !row.is_published });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function onMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    setItems(next);
    setBusy(true);
    try {
      await reorderAdminChapters(
        batch.id,
        next.map((row) => row.id),
      );
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Reorder failed');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: Chapter) {
    const ok = window.confirm(`Delete chapter “${row.title}” and its contents?`);
    if (!ok) return;
    setBusy(true);
    try {
      await deleteAdminChapter(row.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="course-tests-panel">
      <header className="course-form-head">
        <div>
          <h2>
            {batchSubject.subject.name} · Chapters
          </h2>
          <p className="hint" style={{ margin: '0.25rem 0 0' }}>
            {batch.title}
            {batchSubject.teacher_name ? ` · Teacher: ${batchSubject.teacher_name}` : ''} ·{' '}
            {batchSubject.chapter_count} chapters · {batchSubject.video_count} videos ·{' '}
            {batchSubject.pdf_count} PDFs · {batchSubject.test_count} tests
          </p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn ghost" onClick={onBack}>
            ← Subjects
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
          <p className="hint">No chapters in this subject yet. Add the first one below.</p>
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Chapter</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{row.title}</strong>
                    {row.is_free_preview ? <small> · Free preview</small> : null}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={row.is_published ? 'badge badge-active' : 'badge badge-inactive'}
                      disabled={busy}
                      title="Toggle published / draft"
                      onClick={() => void onTogglePublished(row)}
                    >
                      {row.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={busy || index === 0}
                      onClick={() => void onMove(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={busy || index === items.length - 1}
                      onClick={() => void onMove(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      disabled={busy}
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

      <form className="form-grid" style={{ marginTop: '1rem' }} onSubmit={onAdd}>
        <label>
          New chapter title *
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Chapter 1: Real Numbers"
          />
        </label>
        <label>
          Description
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={newFreePreview}
            onChange={(e) => setNewFreePreview(e.target.checked)}
          />
          Free preview
        </label>
        <div className="form-actions" style={{ alignSelf: 'end' }}>
          <button type="submit" className="btn primary" disabled={busy || newTitle.trim().length < 2}>
            {busy ? 'Working…' : '+ Add Chapter'}
          </button>
        </div>
      </form>
    </div>
  );
}
