/**
 * Video Management — CRUD, course/chapter assign, YouTube URL, type, free/paid.
 */
import { useCallback, useEffect, useState } from 'react';

import type { CourseSummary, Video } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { VideoForm } from '@/features/videos/VideoForm';
import {
  deleteAdminVideo,
  fetchAdminVideos,
  fetchCoursesForVideoPicker,
  type VideoFilters,
} from '@/features/videos/api';
import { ApiClientError } from '@/services/api';

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export function VideosPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [filters, setFilters] = useState<VideoFilters>({
    search: '',
    videoType: 'all',
    access: 'all',
    status: 'all',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);

  useEffect(() => {
    void fetchCoursesForVideoPicker()
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
      const page = await fetchAdminVideos(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load videos');
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

  function openEdit(video: Video) {
    setEditing(video);
    setEditorOpen(true);
  }

  async function onDelete(video: Video) {
    const ok = window.confirm(`Delete video “${video.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminVideo(video.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  return (
    <div className="page">
      <PageHeader
        title="Videos"
        description="Assign YouTube unlisted videos to a course chapter. Only the URL is stored in PostgreSQL."
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
          value={filters.videoType ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              videoType: e.target.value as VideoFilters['videoType'],
              page: 1,
            }))
          }
        >
          <option value="all">All types</option>
          <option value="recorded">Recorded</option>
          <option value="live">Live</option>
        </select>
        <select
          value={filters.access ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              access: e.target.value as VideoFilters['access'],
              page: 1,
            }))
          }
        >
          <option value="all">Free + Paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <input
          className="toolbar-search"
          placeholder="Search title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="button" className="btn primary" onClick={openCreate}>
          + Create Video
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">No videos yet. Create one and paste a YouTube unlisted URL.</p>
      ) : null}

      <div className="video-admin-list">
        {items.map((video) => (
          <article key={video.id} className="video-admin-card">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt=""
                className="video-admin-thumb"
              />
            ) : (
              <div className="video-admin-thumb video-admin-thumb-empty">No thumb</div>
            )}
            <div className="video-admin-meta">
              <strong>{video.title}</strong>
              <span>
                {video.course_title ?? 'Course'} · {video.chapter_title ?? 'Chapter'} ·{' '}
                {video.video_type === 'live' ? 'Live' : 'Recorded'} ·{' '}
                {video.is_free ? 'Free' : 'Paid'} · {formatDuration(video.duration_seconds)} ·
                order {video.sort_order}
                {!video.is_published ? ' · Draft' : ''}
              </span>
              <span className="banner-admin-link">{video.youtube_url}</span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => openEdit(video)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(video)}
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
            Page {filters.page ?? 1} / {totalPages} ({total} videos)
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
            <VideoForm
              video={editing}
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
