/**
 * Create / edit home banner — image upload + typed redirect + sort + enable.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Banner, BannerRedirectType, CourseSummary, LiveClass, Test } from '@sharanam/shared';

import {
  createAdminBanner,
  updateAdminBanner,
  uploadBannerImage,
  type BannerWritePayload,
} from '@/features/banners/api';
import { fetchAdminCourses } from '@/features/courses/api';
import { fetchAdminLiveClasses } from '@/features/live-classes/api';
import { fetchAdminTests } from '@/features/tests/api';
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
  redirect_type: BannerRedirectType;
  redirect_target_id: string;
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
      redirect_type: 'none',
      redirect_target_id: '',
      redirect_url: '',
      status: 'active',
      sort_order: String(nextSortOrder),
    };
  }
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    image: banner.image,
    redirect_type: banner.redirect_type ?? 'none',
    redirect_target_id: banner.redirect_target_id ?? '',
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
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    setForm(fromBanner(banner, nextSortOrder));
    setError(null);
  }, [banner, nextSortOrder]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setOptionsLoading(true);
      try {
        const [coursePage, testPage, livePage] = await Promise.all([
          fetchAdminCourses({ page: 1, pageSize: 100, status: 'all' }),
          fetchAdminTests({ page: 1, pageSize: 100, status: 'all' }),
          fetchAdminLiveClasses({ page: 1, pageSize: 100, publishStatus: 'all' }),
        ]);
        if (cancelled) return;
        setCourses(coursePage.items ?? []);
        setTests(testPage.items ?? []);
        setLiveClasses(livePage.items ?? []);
      } catch {
        if (!cancelled) {
          setCourses([]);
          setTests([]);
          setLiveClasses([]);
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

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
      setError('Upload a banner image (or paste an image URL)');
      return;
    }

    const payload: BannerWritePayload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image: form.image.trim(),
      redirect_type: form.redirect_type,
      redirect_target_id:
        form.redirect_type === 'course' ||
        form.redirect_type === 'test' ||
        form.redirect_type === 'live_class'
          ? form.redirect_target_id || null
          : null,
      redirect_url:
        form.redirect_type === 'website' ? form.redirect_url.trim() || null : null,
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
        <h2>{banner ? 'Edit Banner' : 'Create Banner'}</h2>
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
          Upload image *
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

        <label>
          Redirect to
          <select
            value={form.redirect_type}
            onChange={(e) => {
              const next = e.target.value as BannerRedirectType;
              setForm((prev) => ({
                ...prev,
                redirect_type: next,
                redirect_target_id: '',
                redirect_url: next === 'website' ? prev.redirect_url : '',
              }));
            }}
          >
            <option value="none">None (image only)</option>
            <option value="course">Course</option>
            <option value="test">Test</option>
            <option value="live_class">Live Class</option>
            <option value="website">Website</option>
          </select>
        </label>

        <label>
          Enable / Disable
          <select
            value={form.status}
            onChange={(e) => setField('status', e.target.value as 'active' | 'inactive')}
          >
            <option value="active">Enabled (show on Home)</option>
            <option value="inactive">Disabled (hidden)</option>
          </select>
        </label>

        {form.redirect_type === 'course' ? (
          <label className="span-2">
            Choose course *
            <select
              required
              value={form.redirect_target_id}
              disabled={optionsLoading}
              onChange={(e) => setField('redirect_target_id', e.target.value)}
            >
              <option value="">{optionsLoading ? 'Loading…' : 'Select course'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {form.redirect_type === 'test' ? (
          <label className="span-2">
            Choose test *
            <select
              required
              value={form.redirect_target_id}
              disabled={optionsLoading}
              onChange={(e) => setField('redirect_target_id', e.target.value)}
            >
              <option value="">{optionsLoading ? 'Loading…' : 'Select test'}</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {form.redirect_type === 'live_class' ? (
          <label className="span-2">
            Choose live class *
            <select
              required
              value={form.redirect_target_id}
              disabled={optionsLoading}
              onChange={(e) => setField('redirect_target_id', e.target.value)}
            >
              <option value="">{optionsLoading ? 'Loading…' : 'Select live class'}</option>
              {liveClasses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {form.redirect_type === 'website' ? (
          <label className="span-2">
            Website URL *
            <input
              required
              type="url"
              value={form.redirect_url}
              onChange={(e) => setField('redirect_url', e.target.value)}
              placeholder="https://example.com/offer"
            />
          </label>
        ) : null}

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
          {saving ? 'Saving…' : banner ? 'Update Banner' : 'Create Banner'}
        </button>
      </div>
    </form>
  );
}
