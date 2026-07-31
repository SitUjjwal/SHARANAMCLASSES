/**
 * Live Class Management — CRUD, schedule, YouTube Live URL, notify.
 */
import { useCallback, useEffect, useState } from 'react';

import type { CourseSummary, LiveClass } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { LiveClassForm } from '@/features/live-classes/LiveClassForm';
import {
  deleteAdminLiveClass,
  fetchAdminLiveClasses,
  fetchCoursesForLiveClassPicker,
  notifyAdminLiveClass,
  type LiveClassFilters,
} from '@/features/live-classes/api';
import { ApiClientError } from '@/services/api';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function LiveClassesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [filters, setFilters] = useState<LiveClassFilters>({
    search: '',
    status: 'all',
    publishStatus: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<LiveClass[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCoursesForLiveClassPicker()
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
      const page = await fetchAdminLiveClasses(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load live classes');
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

  function openEdit(live: LiveClass) {
    setEditing(live);
    setEditorOpen(true);
  }

  async function onDelete(live: LiveClass) {
    const ok = window.confirm(`Delete live class “${live.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminLiveClass(live.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function onNotify(live: LiveClass) {
    const already = live.notification_sent_at
      ? '\n\nA notification was already sent. Send again?'
      : '';
    const ok = window.confirm(
      `Send in-app notification for “${live.title}”?${already}\n\nThis publishes an update on the student Home screen.`,
    );
    if (!ok) return;
    setNotifyingId(live.id);
    try {
      await notifyAdminLiveClass(live.id);
      await load();
      window.alert('Notification sent.');
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Notify failed');
    } finally {
      setNotifyingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  return (
    <div className="page">
      <PageHeader
        title="Live Classes"
        description="Schedule YouTube Live sessions, upload a thumbnail, and notify students (in-app Home updates)."
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
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as LiveClassFilters['status'],
              page: 1,
            }))
          }
        >
          <option value="all">All schedule</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live now</option>
          <option value="ended">Ended</option>
        </select>
        <select
          value={filters.publishStatus ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              publishStatus: e.target.value as LiveClassFilters['publishStatus'],
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
          + Create Live Class
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">No live classes yet. Create one and paste a YouTube Live URL.</p>
      ) : null}

      <div className="video-admin-list">
        {items.map((live) => (
          <article key={live.id} className="video-admin-card">
            {live.thumbnail_url ? (
              <img src={live.thumbnail_url} alt="" className="video-admin-thumb" />
            ) : (
              <div className="video-admin-thumb video-admin-thumb-empty">LIVE</div>
            )}
            <div className="video-admin-meta">
              <strong>{live.title}</strong>
              <span>
                {live.course_title ?? 'General'} · {(live.status ?? 'upcoming').toUpperCase()} ·{' '}
                {live.is_published ? 'Published' : 'Draft'}
                {live.notification_sent_at ? ' · Notified' : ''}
              </span>
              <span>
                {formatWhen(live.start_time)} → {formatWhen(live.end_time)}
              </span>
              <span className="banner-admin-link">{live.youtube_url}</span>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="btn ghost"
                disabled={notifyingId === live.id || !live.is_published}
                onClick={() => void onNotify(live)}
              >
                {notifyingId === live.id ? 'Sending…' : 'Notify'}
              </button>
              <button type="button" className="btn ghost" onClick={() => openEdit(live)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(live)}
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
            Page {filters.page ?? 1} / {totalPages} ({total} classes)
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
            <LiveClassForm
              liveClass={editing}
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
