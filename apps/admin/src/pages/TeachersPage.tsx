/**
 * Teacher management — list / create / edit / delete / view stats & assignments.
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { TeacherDetailPanel } from '@/features/teachers/TeacherDetailPanel';
import { TeacherForm } from '@/features/teachers/TeacherForm';
import {
  deleteAdminTeacher,
  fetchAdminTeachers,
  type TeacherRecord,
} from '@/features/teachers/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiClientError } from '@/services/api';

export function TeachersPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<TeacherRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!can('teachers:manage')) {
      setLoading(false);
      setError('You do not have permission to manage teachers.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminTeachers());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load teachers');
      }
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(teacher: TeacherRecord) {
    setEditing(teacher);
    setEditorOpen(true);
  }

  async function onRemove(teacher: TeacherRecord) {
    if (teacher.role === 'admin') {
      window.alert('Admin accounts cannot be removed from Teachers.');
      return;
    }
    const ok = window.confirm(
      `Remove “${teacher.full_name}” from teachers? Course and live-class assignments will be cleared. Account stays as student.`,
    );
    if (!ok) return;
    try {
      await deleteAdminTeacher(teacher.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Remove failed');
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (t) =>
          t.full_name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          (t.phone_number ?? '').includes(q),
      )
    : items;

  if (!can('teachers:manage')) {
    return (
      <div className="page">
        <PageHeader title="Teachers" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Teachers"
        description="Add, edit, delete instructors; assign courses and live classes; view statistics."
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Add Teacher
          </button>
        }
      />

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !filtered.length ? (
        <div className="empty-state">
          <p className="hint">No teachers yet.</p>
          <button type="button" className="btn primary" onClick={openCreate}>
            + Add Teacher
          </button>
        </div>
      ) : null}

      {!loading && filtered.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Courses</th>
                <th>Live</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.full_name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.phone_number || '—'}</td>
                  <td>{teacher.role}</td>
                  <td>{teacher.course_count ?? 0}</td>
                  <td>{teacher.live_class_count ?? 0}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setViewingId(teacher.id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => openEdit(teacher)}
                    >
                      Edit
                    </button>
                    {teacher.role === 'instructor' ? (
                      <button
                        type="button"
                        className="btn ghost danger"
                        onClick={() => void onRemove(teacher)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {viewingId ? (
        <TeacherDetailPanel
          teacherId={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={() => void load()}
          onEdit={(teacher) => {
            setViewingId(null);
            openEdit(teacher);
          }}
        />
      ) : null}

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <TeacherForm
              teacher={editing}
              onCancel={() => setEditorOpen(false)}
              onSaved={async () => {
                setEditorOpen(false);
                await load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
