/**
 * Create / edit announcement — rich text, image, schedule, pin.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Announcement } from '@sharanam/shared';

import {
  createAdminAnnouncement,
  updateAdminAnnouncement,
  uploadAnnouncementImage,
  type AnnouncementWritePayload,
} from '@/features/announcements/api';
import { RichTextEditor } from '@/features/announcements/RichTextEditor';
import { ApiClientError } from '@/services/api';

type AnnouncementFormProps = {
  announcement: Announcement | null;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  body: string;
  image_url: string;
  is_pinned: boolean;
  is_published: boolean;
  scheduled_local: string;
};

function toLocalInput(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function fromAnnouncement(item: Announcement | null): FormState {
  if (!item) {
    return {
      title: '',
      body: '',
      image_url: '',
      is_pinned: false,
      is_published: true,
      scheduled_local: toLocalInput(new Date().toISOString()),
    };
  }
  return {
    title: item.title,
    body: item.body ?? '',
    image_url: item.image_url ?? '',
    is_pinned: item.is_pinned,
    is_published: item.is_published,
    scheduled_local: toLocalInput(item.scheduled_at),
  };
}

export function AnnouncementForm({
  announcement,
  onSaved,
  onCancel,
}: AnnouncementFormProps) {
  const [form, setForm] = useState<FormState>(() => fromAnnouncement(announcement));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromAnnouncement(announcement));
    setError(null);
  }, [announcement]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAnnouncementImage(file);
      setField('image_url', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: AnnouncementWritePayload = {
      title: form.title.trim(),
      body: form.body,
      image_url: form.image_url.trim() || null,
      is_pinned: form.is_pinned,
      is_published: form.is_published,
      scheduled_at: fromLocalInput(form.scheduled_local),
    };

    setSaving(true);
    setError(null);
    try {
      if (announcement) {
        await updateAdminAnnouncement(announcement.id, payload);
      } else {
        await createAdminAnnouncement(payload);
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
        <h2>{announcement ? 'Edit Announcement' : 'Create Announcement'}</h2>
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
            placeholder="Exam timetable / holiday notice"
          />
        </label>

        <div className="span-2">
          <span className="field-label">Rich text body</span>
          <RichTextEditor value={form.body} onChange={(html) => setField('body', html)} />
        </div>

        <label className="span-2 file-upload-field">
          Image (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          {uploading ? <span className="hint">Uploading…</span> : null}
        </label>

        <label className="span-2">
          Image URL
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setField('image_url', e.target.value)}
            placeholder="https://… (auto-fills after upload)"
          />
        </label>

        {form.image_url ? (
          <div className="span-2 banner-preview">
            <img src={form.image_url} alt="Announcement" />
          </div>
        ) : null}

        <label>
          Schedule (show from)
          <input
            type="datetime-local"
            required
            value={form.scheduled_local}
            onChange={(e) => setField('scheduled_local', e.target.value)}
          />
        </label>

        <label>
          Published
          <select
            value={form.is_published ? 'yes' : 'no'}
            onChange={(e) => setField('is_published', e.target.value === 'yes')}
          >
            <option value="yes">Yes (visible when schedule due)</option>
            <option value="no">No (draft / hidden)</option>
          </select>
        </label>

        <label className="span-2 checkbox-row">
          <input
            type="checkbox"
            checked={form.is_pinned}
            onChange={(e) => setField('is_pinned', e.target.checked)}
          />
          Pin announcement (shows at top of Home)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : announcement ? 'Update' : 'Create Announcement'}
        </button>
      </div>
    </form>
  );
}
