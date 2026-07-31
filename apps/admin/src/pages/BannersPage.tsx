/**
 * Banner Slider management — up to 20 home slides.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Banner } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { BannerForm } from '@/features/banners/BannerForm';
import { deleteAdminBanner, fetchAdminBanners } from '@/features/banners/api';
import { ApiClientError } from '@/services/api';

const MAX_BANNERS = 20;

export function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

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

  const atLimit = items.length >= MAX_BANNERS;

  return (
    <div className="page">
      <PageHeader
        title="Banner Slider"
        description="Home screen carousel — upload image, set title/link, activate. Max 20 banners."
      />

      <div className="toolbar">
        <p className="hint" style={{ margin: 0, flex: 1 }}>
          {items.length} / {MAX_BANNERS} banners · Active ones appear on mobile Home
        </p>
        <button
          type="button"
          className="btn primary"
          disabled={atLimit}
          onClick={openCreate}
          title={atLimit ? 'Maximum 20 banners' : 'Add banner'}
        >
          + Add Banner
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading && !items.length ? (
        <p className="hint">No banners yet. Add the first slide for the Home slider.</p>
      ) : null}

      <div className="banner-admin-list">
        {items.map((banner) => (
          <article key={banner.id} className="banner-admin-card">
            <img src={banner.image} alt={banner.title} className="banner-admin-thumb" />
            <div className="banner-admin-meta">
              <strong>{banner.title}</strong>
              <span>
                {banner.subtitle || 'No subtitle'} · Order {banner.sort_order} ·{' '}
                {banner.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              {banner.redirect_url ? (
                <span className="banner-admin-link">{banner.redirect_url}</span>
              ) : null}
            </div>
            <div className="row-actions">
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
