/**
 * Announcements admin — Create / Edit / Delete / Schedule / Pin.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Announcement } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { AnnouncementForm } from '@/features/announcements/AnnouncementForm';
import {
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
} from '@/features/announcements/api';
import { ApiClientError } from '@/services/api';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function statusLabel(item: Announcement): string {
  const due = new Date(item.scheduled_at).getTime() <= Date.now();
  if (!item.is_published) return 'Draft';
  if (!due) return 'Scheduled';
  return 'Live';
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminAnnouncements());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load announcements');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function onDelete(item: Announcement) {
    const ok = window.confirm(`Delete announcement “${item.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminAnnouncement(item.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function onTogglePin(item: Announcement) {
    try {
      await updateAdminAnnouncement(item.id, { is_pinned: !item.is_pinned });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Update failed');
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Announcements"
        description="Create Home notices with rich text, image, schedule, and pin."
      />

      <div className="toolbar">
        <p className="hint" style={{ margin: 0, flex: 1 }}>
          {items.length} announcements · Pinned + live items appear on student Home
        </p>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Create Announcement
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <p className="hint">No announcements yet. Create the first Home notice.</p>
      ) : null}

      <div className="banner-admin-list">
        {items.map((item) => (
          <article key={item.id} className="banner-admin-card">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="banner-admin-thumb" />
            ) : (
              <div className="banner-admin-thumb banner-admin-thumb-empty">No image</div>
            )}
            <div className="banner-admin-meta">
              <strong>
                {item.is_pinned ? '📌 ' : ''}
                {item.title}
              </strong>
              <span>
                {statusLabel(item)} · Schedule{' '}
                {new Date(item.scheduled_at).toLocaleString()}
              </span>
              <span className="banner-admin-link">
                {stripHtml(item.body).slice(0, 120) || 'No body'}
              </span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => void onTogglePin(item)}>
                {item.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button type="button" className="btn ghost" onClick={() => openEdit(item)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(item)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <AnnouncementForm
              announcement={editing}
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
