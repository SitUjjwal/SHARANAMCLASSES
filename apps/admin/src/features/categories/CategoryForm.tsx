/**
 * Create / edit Home category tile.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Category } from '@sharanam/shared';

import {
  createAdminCategory,
  slugifyCategoryName,
  updateAdminCategory,
  uploadCategoryIcon,
  type CategoryWritePayload,
} from '@/features/categories/api';
import { ApiClientError } from '@/services/api';

type CategoryFormProps = {
  category: Category | null;
  nextSortOrder: number;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  name: string;
  slug: string;
  icon: string;
  link_url: string;
  sort_order: string;
  is_active: boolean;
  slugTouched: boolean;
};

const ICON_PRESETS = ['📘', '🧪', '📙', '🌎', '📝', '🎥', '📚', '🔴', '⭐', '🆕', '📖', '💻'];

function fromCategory(category: Category | null, nextSortOrder: number): FormState {
  if (!category) {
    return {
      name: '',
      slug: '',
      icon: '📘',
      link_url: '',
      sort_order: String(nextSortOrder),
      is_active: true,
      slugTouched: false,
    };
  }
  return {
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? '📘',
    link_url: category.link_url ?? '',
    sort_order: String(category.sort_order ?? 0),
    is_active: category.is_active,
    slugTouched: true,
  };
}

function isImageIcon(icon: string): boolean {
  return /^https?:\/\//i.test(icon.trim());
}

export function CategoryForm({
  category,
  nextSortOrder,
  onSaved,
  onCancel,
}: CategoryFormProps) {
  const [form, setForm] = useState<FormState>(() => fromCategory(category, nextSortOrder));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromCategory(category, nextSortOrder));
    setError(null);
  }, [category, nextSortOrder]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onUploadPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCategoryIcon(file);
      setField('icon', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CategoryWritePayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugifyCategoryName(form.name),
      icon: form.icon.trim() || null,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    setSaving(true);
    setError(null);
    try {
      if (category) {
        await updateAdminCategory(category.id, payload);
      } else {
        await createAdminCategory(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="course-form" onSubmit={(e) => void onSubmit(e)}>
      <div className="course-form-head">
        <h2>{category ? 'Edit Category' : 'Add Category'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="category-form-preview">
        <div className="category-tile category-tile-preview">
          <div className="category-tile-icon">
            {isImageIcon(form.icon) ? (
              <img src={form.icon} alt="" />
            ) : (
              <span>{form.icon || '📘'}</span>
            )}
          </div>
          <strong>{form.name.trim() || 'Category name'}</strong>
        </div>
      </div>

      <div className="form-grid">
        <label className="span-2">
          Name *
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((prev) => ({
                ...prev,
                name,
                slug: prev.slugTouched ? prev.slug : slugifyCategoryName(name),
              }));
            }}
            placeholder="e.g. Free Test Series"
          />
        </label>

        <label className="span-2">
          Slug *
          <input
            required
            minLength={2}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                slug: e.target.value,
                slugTouched: true,
              }));
            }}
            placeholder="free-test-series"
          />
        </label>

        <label className="span-2 file-upload-field">
          Upload photo (JPEG / PNG / WebP)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              void onUploadPhoto(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
          {uploading ? <span className="hint">Uploading…</span> : null}
          {isImageIcon(form.icon) ? (
            <span className="hint">Photo set — it will show on the category tile.</span>
          ) : (
            <span className="hint">Or pick an emoji below.</span>
          )}
        </label>

        {isImageIcon(form.icon) ? (
          <div className="span-2">
            <button type="button" className="btn ghost" onClick={() => setField('icon', '📘')}>
              Remove photo (use emoji instead)
            </button>
          </div>
        ) : null}

        <div className="span-2 icon-preset-row">
          {ICON_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={form.icon === emoji ? 'icon-preset active' : 'icon-preset'}
              onClick={() => setField('icon', emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <label className="span-2">
          Social / external link (optional)
          <input
            type="text"
            inputMode="url"
            value={form.link_url}
            onChange={(e) => setField('link_url', e.target.value)}
            placeholder="https://instagram.com/… or https://wa.me/91… or https://youtube.com/…"
          />
          <span className="hint">
            If set, tapping this category in the student app opens this link. Leave blank to open
            courses for this category.
          </span>
        </label>

        <label>
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setField('sort_order', e.target.value)}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField('is_active', e.target.checked)}
          />
          Active (show on Home)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : category ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  );
}
