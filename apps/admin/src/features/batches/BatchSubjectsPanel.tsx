/**
 * Manage subjects attached to one batch — list, add, reorder, toggle, remove.
 */
import { useCallback, useEffect, useState } from 'react';

import type { BatchSubject, CourseSummary, Subject } from '@sharanam/shared';

import {
  addSubjectsToBatch,
  fetchBatchSubjects,
  fetchSubjects,
  removeSubjectFromBatch,
  reorderBatchSubjects,
  updateBatchSubject,
} from '@/features/batches/api';
import type { TeacherOption } from '@/features/courses/api';
import { ApiClientError } from '@/services/api';

type BatchSubjectsPanelProps = {
  batch: CourseSummary;
  teachers: TeacherOption[];
  onClose: () => void;
  onOpenChapters: (row: BatchSubject) => void;
};

export function BatchSubjectsPanel({
  batch,
  teachers,
  onClose,
  onOpenChapters,
}: BatchSubjectsPanelProps) {
  const [items, setItems] = useState<BatchSubject[]>([]);
  const [catalog, setCatalog] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [addSubjectId, setAddSubjectId] = useState('');
  const [addName, setAddName] = useState('');
  const [addTeacherId, setAddTeacherId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchBatchSubjects(batch.id);
      setItems(rows);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load subjects');
      }
    } finally {
      setLoading(false);
    }
  }, [batch.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchSubjects({ status: 'active' })
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const availableSubjects = catalog.filter(
    (subject) => !items.some((row) => row.subject_id === subject.id),
  );

  async function onAdd() {
    const name = addName.trim();
    if (!addSubjectId && !name) {
      setError('Pick an existing subject or type a new subject name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addSubjectsToBatch(batch.id, [
        {
          ...(addSubjectId ? { subject_id: addSubjectId } : { name }),
          teacher_id: addTeacherId || null,
        },
      ]);
      setAddSubjectId('');
      setAddName('');
      setAddTeacherId('');
      await load();
      if (name) {
        // New subject entered the master catalog; refresh the picker.
        void fetchSubjects({ status: 'active' })
          .then(setCatalog)
          .catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add subject');
    } finally {
      setBusy(false);
    }
  }

  async function onToggleStatus(row: BatchSubject) {
    setBusy(true);
    try {
      await updateBatchSubject(row.id, {
        status: row.status === 'active' ? 'inactive' : 'active',
      });
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
      const rows = await reorderBatchSubjects(
        batch.id,
        next.map((row) => row.id),
      );
      setItems(rows);
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Reorder failed');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(row: BatchSubject) {
    const ok = window.confirm(
      `Remove “${row.subject.name}” from this batch?\n\nIts chapters and content inside this batch will no longer be reachable.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await removeSubjectFromBatch(batch.id, row.subject_id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Remove failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="course-tests-panel">
      <header className="course-form-head">
        <div>
          <h2>Subjects · {batch.title}</h2>
          <p className="hint" style={{ margin: '0.25rem 0 0' }}>
            Attach subjects, assign teachers, and order them for students.
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <div className="empty-state">
          <p className="hint">No subjects in this batch yet. Add one below.</p>
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Content</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.subject.name}</strong>
                    {row.subject.code ? <small> · {row.subject.code}</small> : null}
                  </td>
                  <td>{row.teacher_name || '—'}</td>
                  <td>
                    {row.chapter_count} ch · {row.video_count} vid · {row.pdf_count} pdf ·{' '}
                    {row.test_count} tests
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        row.status === 'active' ? 'badge badge-active' : 'badge badge-inactive'
                      }
                      disabled={busy}
                      title="Toggle active / inactive"
                      onClick={() => void onToggleStatus(row)}
                    >
                      {row.status === 'active' ? 'Active' : 'Inactive'}
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
                      className="btn ghost"
                      onClick={() => onOpenChapters(row)}
                    >
                      Manage Chapters
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      disabled={busy}
                      onClick={() => void onRemove(row)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="form-grid" style={{ marginTop: '1rem' }}>
        <label>
          Add existing subject
          <select
            value={addSubjectId}
            onChange={(e) => {
              setAddSubjectId(e.target.value);
              if (e.target.value) setAddName('');
            }}
          >
            <option value="">— Select subject —</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.code ? ` (${subject.code})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Or create new subject
          <input
            placeholder="e.g. Sanskrit"
            value={addName}
            onChange={(e) => {
              setAddName(e.target.value);
              if (e.target.value) setAddSubjectId('');
            }}
          />
        </label>

        <label>
          Teacher (optional)
          <select value={addTeacherId} onChange={(e) => setAddTeacherId(e.target.value)}>
            <option value="">— No teacher —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn primary"
          disabled={busy || (!addSubjectId && !addName.trim())}
          onClick={() => void onAdd()}
        >
          {busy ? 'Working…' : '+ Add Subject'}
        </button>
      </div>
    </div>
  );
}
