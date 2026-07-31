/**
 * Create / edit live class — YouTube Live URL, schedule, thumbnail, publish.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { CourseSummary, LiveClass } from '@sharanam/shared';

import {
  createAdminLiveClass,
  fromDatetimeLocalValue,
  isValidYouTubeUrlClient,
  toDatetimeLocalValue,
  updateAdminLiveClass,
  uploadLiveClassThumbnail,
  type LiveClassWritePayload,
} from '@/features/live-classes/api';
import { ApiClientError } from '@/services/api';

type LiveClassFormProps = {
  liveClass: LiveClass | null;
  courses: CourseSummary[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  course_id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string;
  start_time: string;
  end_time: string;
  is_published: boolean;
};

function defaultEndLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return toDatetimeLocalValue(d.toISOString());
}

function defaultStartLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return toDatetimeLocalValue(d.toISOString());
}

function fromLiveClass(live: LiveClass | null, defaultCourseId: string): FormState {
  if (!live) {
    return {
      course_id: defaultCourseId,
      title: '',
      description: '',
      youtube_url: '',
      thumbnail_url: '',
      start_time: defaultStartLocal(),
      end_time: defaultEndLocal(),
      is_published: true,
    };
  }
  return {
    course_id: live.course_id ?? '',
    title: live.title,
    description: live.description ?? '',
    youtube_url: live.youtube_url,
    thumbnail_url: live.thumbnail_url ?? '',
    start_time: toDatetimeLocalValue(live.start_time),
    end_time: toDatetimeLocalValue(live.end_time),
    is_published: live.is_published,
  };
}

export function LiveClassForm({
  liveClass,
  courses,
  onSaved,
  onCancel,
}: LiveClassFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    fromLiveClass(liveClass, courses[0]?.id ?? ''),
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromLiveClass(liveClass, courses[0]?.id ?? ''));
    setError(null);
    setFieldErrors({});
  }, [liveClass, courses]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!isValidYouTubeUrlClient(form.youtube_url)) {
      next.youtube_url = 'Paste a valid YouTube Live / watch URL';
    }
    if (!form.start_time) next.start_time = 'Start time is required';
    if (!form.end_time) next.end_time = 'End time is required';
    const startIso = fromDatetimeLocalValue(form.start_time);
    const endIso = fromDatetimeLocalValue(form.end_time);
    if (startIso && endIso && Date.parse(endIso) <= Date.parse(startIso)) {
      next.end_time = 'End time must be after start time';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadLiveClassThumbnail(file);
      setField('thumbnail_url', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Thumbnail upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const payload: LiveClassWritePayload = {
      course_id: form.course_id || null,
      title: form.title.trim(),
      description: form.description.trim(),
      youtube_url: form.youtube_url.trim(),
      thumbnail_url: form.thumbnail_url.trim() || null,
      start_time: fromDatetimeLocalValue(form.start_time),
      end_time: fromDatetimeLocalValue(form.end_time),
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (liveClass) {
        await updateAdminLiveClass(liveClass.id, payload);
      } else {
        await createAdminLiveClass(payload);
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
        <h2>{liveClass ? 'Update Live Class' : 'Create Live Class'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label>
          Course
          <select
            value={form.course_id}
            onChange={(e) => setField('course_id', e.target.value)}
          >
            <option value="">No course (general)</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox" style={{ alignSelf: 'end' }}>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
          />
          Published
        </label>

        <label className="span-2">
          Title *
          <input
            required
            minLength={2}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Class 10 Maths — Live Doubt Session"
          />
          {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
        </label>

        <label className="span-2">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </label>

        <label className="span-2">
          YouTube Live URL *
          <input
            required
            type="url"
            placeholder="https://www.youtube.com/live/… or watch?v=…"
            value={form.youtube_url}
            onChange={(e) => setField('youtube_url', e.target.value)}
          />
          {fieldErrors.youtube_url ? (
            <span className="field-error">{fieldErrors.youtube_url}</span>
          ) : (
            <span className="hint">Only the URL is stored in PostgreSQL.</span>
          )}
        </label>

        <label>
          Start Time *
          <input
            required
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setField('start_time', e.target.value)}
          />
          {fieldErrors.start_time ? (
            <span className="field-error">{fieldErrors.start_time}</span>
          ) : null}
        </label>

        <label>
          End Time *
          <input
            required
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setField('end_time', e.target.value)}
          />
          {fieldErrors.end_time ? (
            <span className="field-error">{fieldErrors.end_time}</span>
          ) : null}
        </label>

        <label className="span-2 file-upload-field">
          Thumbnail
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          {uploading ? <span className="hint">Uploading…</span> : null}
          <input
            type="url"
            placeholder="Or paste thumbnail URL (YouTube default if empty)"
            value={form.thumbnail_url}
            onChange={(e) => setField('thumbnail_url', e.target.value)}
            style={{ marginTop: '0.5rem' }}
          />
        </label>

        {form.thumbnail_url ? (
          <div className="span-2 banner-preview">
            <img src={form.thumbnail_url} alt="Live class thumbnail" />
          </div>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
