/**
 * Banner Management — Create / Edit / Delete / Enable / Sort.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Banner } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { BannerForm } from '@/features/banners/BannerForm';
import {
  deleteAdminBanner,
  fetchAdminBanners,
  updateAdminBanner,
} from '@/features/banners/api';
import { ApiClientError } from '@/services/api';

const MAX_BANNERS = 20;

function redirectLabel(banner: Banner): string {
  switch (banner.redirect_type) {
    case 'course':
      return '→ Course';
    case 'test':
      return '→ Test';
    case 'live_class':
      return '→ Live Class';
    case 'website':
      return banner.redirect_url ? `→ ${banner.redirect_url}` : '→ Website';
    default:
      return 'No redirect';
  }
}

export function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminBanners());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load banners');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nextSortOrder =
    items.reduce((max, b) => Math.max(max, Number(b.sort_order) || 0), 0) + 10;

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditing(banner);
    setEditorOpen(true);
  }

  async function onDelete(banner: Banner) {
    const ok = window.confirm(`Delete banner “${banner.title}”?`);
    if (!ok) return;
    try {
      await deleteAdminBanner(banner.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function onToggleStatus(banner: Banner) {
    const next = banner.status === 'active' ? 'inactive' : 'active';
    setTogglingId(banner.id);
    try {
      await updateAdminBanner(banner.id, { status: next });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Update failed');
    } finally {
      setTogglingId(null);
    }
  }

  const atLimit = items.length >= MAX_BANNERS;

  return (
    <div className="page">
      <PageHeader
        title="Banner Management"
        description="Create home slides: upload image, choose redirect (Course / Test / Live / Website), sort, enable or disable. Max 20."
      />

      <div className="toolbar">
        <p className="hint" style={{ margin: 0, flex: 1 }}>
          {items.length} / {MAX_BANNERS} banners · Enabled banners appear on student Home
        </p>
        <button
          type="button"
          className="btn primary"
          disabled={atLimit}
          onClick={openCreate}
          title={atLimit ? 'Maximum 20 banners' : 'Create banner'}
        >
          + Create Banner
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <p className="hint">No banners yet. Create the first Home slider banner.</p>
      ) : null}

      <div className="banner-admin-list">
        {items.map((banner) => (
          <article key={banner.id} className="banner-admin-card">
            <img src={banner.image} alt={banner.title} className="banner-admin-thumb" />
            <div className="banner-admin-meta">
              <strong>{banner.title}</strong>
              <span>
                {banner.subtitle || 'No subtitle'} · Order {banner.sort_order} ·{' '}
                {banner.status === 'active' ? 'Enabled' : 'Disabled'}
              </span>
              <span className="banner-admin-link">{redirectLabel(banner)}</span>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="btn ghost"
                disabled={togglingId === banner.id}
                onClick={() => void onToggleStatus(banner)}
              >
                {banner.status === 'active' ? 'Disable' : 'Enable'}
              </button>
              <button type="button" className="btn ghost" onClick={() => openEdit(banner)}>
                Edit
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => void onDelete(banner)}
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
            <BannerForm
              banner={editing}
              nextSortOrder={nextSortOrder}
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
