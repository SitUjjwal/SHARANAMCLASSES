/**
 * Create / edit home banner slider slide.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Banner } from '@sharanam/shared';

import {
  createAdminBanner,
  updateAdminBanner,
  uploadBannerImage,
  type BannerWritePayload,
} from '@/features/banners/api';
import { ApiClientError } from '@/services/api';

type BannerFormProps = {
  banner: Banner | null;
  nextSortOrder: number;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  subtitle: string;
  image: string;
  redirect_url: string;
  status: 'active' | 'inactive';
  sort_order: string;
};

function fromBanner(banner: Banner | null, nextSortOrder: number): FormState {
  if (!banner) {
    return {
      title: '',
      subtitle: '',
      image: '',
      redirect_url: '',
      status: 'active',
      sort_order: String(nextSortOrder),
    };
  }
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    image: banner.image,
    redirect_url: banner.redirect_url ?? '',
    status: banner.status,
    sort_order: String(banner.sort_order ?? 0),
  };
}

export function BannerForm({ banner, nextSortOrder, onSaved, onCancel }: BannerFormProps) {
  const [form, setForm] = useState<FormState>(() => fromBanner(banner, nextSortOrder));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromBanner(banner, nextSortOrder));
    setError(null);
  }, [banner, nextSortOrder]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadBannerImage(file);
      setField('image', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.image.trim()) {
      setError('Banner image upload karo (ya URL paste karo)');
      return;
    }

    const payload: BannerWritePayload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image: form.image.trim(),
      redirect_url: form.redirect_url.trim() || null,
      status: form.status,
      sort_order: Number(form.sort_order) || 0,
    };

    setSaving(true);
    setError(null);
    try {
      if (banner) {
        await updateAdminBanner(banner.id, payload);
      } else {
        await createAdminBanner(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="course-form" onSubmit={onSubmit}>
      <div className="course-form-head">
        <h2>{banner ? 'Edit Banner' : 'Add Banner'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label className="span-2">
          Title *
          <input
            required
            minLength={2}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Home offer headline"
          />
        </label>

        <label className="span-2">
          Subtitle
          <input
            value={form.subtitle}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Optional short line under title"
          />
        </label>

        <label className="span-2 file-upload-field">
          Banner image * (upload)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          {uploading ? <span className="hint">Uploading…</span> : null}
        </label>

        <label className="span-2">
          Image URL *
          <input
            required
            type="url"
            value={form.image}
            onChange={(e) => setField('image', e.target.value)}
            placeholder="https://… (auto-fills after upload)"
          />
        </label>

        {form.image ? (
          <div className="span-2 banner-preview">
            <img src={form.image} alt="Banner preview" />
          </div>
        ) : null}

        <label className="span-2">
          Tap / click link (optional)
          <input
            type="url"
            value={form.redirect_url}
            onChange={(e) => setField('redirect_url', e.target.value)}
            placeholder="https://… or leave empty"
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setField('status', e.target.value as 'active' | 'inactive')}
          >
            <option value="active">Active (show on Home)</option>
            <option value="inactive">Inactive (hidden)</option>
          </select>
        </label>

        <label>
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setField('sort_order', e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : banner ? 'Update Banner' : 'Add Banner'}
        </button>
      </div>
    </form>
  );
}
