/**
 * Chapter create / edit form.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Chapter } from '@sharanam/shared';

import {
  createAdminChapter,
  updateAdminChapter,
  type ChapterWritePayload,
} from '@/features/chapters/api';
import { ApiClientError } from '@/services/api';

type ChapterFormProps = {
  courseId: string;
  chapter: Chapter | null;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  description: string;
  duration_seconds: string;
  video_count: string;
  pdf_count: string;
  notes_count: string;
  video_url: string;
  is_free_preview: boolean;
  is_published: boolean;
};

function fromChapter(chapter: Chapter | null): FormState {
  if (!chapter) {
    return {
      title: '',
      description: '',
      duration_seconds: '0',
      video_count: '0',
      pdf_count: '0',
      notes_count: '0',
      video_url: '',
      is_free_preview: false,
      is_published: true,
    };
  }

  return {
    title: chapter.title,
    description: chapter.description ?? '',
    duration_seconds: String(chapter.duration_seconds ?? 0),
    video_count: String(chapter.video_count ?? 0),
    pdf_count: String(chapter.pdf_count ?? 0),
    notes_count: String(chapter.notes_count ?? 0),
    video_url: chapter.video_url ?? '',
    is_free_preview: chapter.is_free_preview,
    is_published: chapter.is_published,
  };
}

export function ChapterForm({ courseId, chapter, onSaved, onCancel }: ChapterFormProps) {
  const [form, setForm] = useState<FormState>(() => fromChapter(chapter));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromChapter(chapter));
    setError(null);
    setFieldErrors({});
  }, [chapter]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (form.video_url.trim() && !/^https?:\/\//i.test(form.video_url.trim())) {
      next.video_url = 'Video URL must start with http(s)://';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const payload: ChapterWritePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      duration_seconds: Number(form.duration_seconds) || 0,
      video_count: Number(form.video_count) || 0,
      pdf_count: Number(form.pdf_count) || 0,
      notes_count: Number(form.notes_count) || 0,
      video_url: form.video_url.trim() || null,
      is_free_preview: form.is_free_preview,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (chapter) {
        await updateAdminChapter(chapter.id, payload);
      } else {
        await createAdminChapter(courseId, payload);
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
        <h2>{chapter ? 'Edit Chapter' : 'Add Chapter'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label className="span-2">
          Chapter name *
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            required
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

        <label>
          Duration (seconds)
          <input
            type="number"
            min={0}
            value={form.duration_seconds}
            onChange={(e) => setField('duration_seconds', e.target.value)}
          />
        </label>

        <label>
          Videos
          <input
            type="number"
            min={0}
            value={form.video_count}
            onChange={(e) => setField('video_count', e.target.value)}
          />
        </label>

        <label>
          PDFs
          <input
            type="number"
            min={0}
            value={form.pdf_count}
            onChange={(e) => setField('pdf_count', e.target.value)}
          />
        </label>

        <label>
          Notes
          <input
            type="number"
            min={0}
            value={form.notes_count}
            onChange={(e) => setField('notes_count', e.target.value)}
          />
        </label>

        <label className="span-2">
          Legacy video URL (optional)
          <input
            value={form.video_url}
            onChange={(e) => setField('video_url', e.target.value)}
            placeholder="https://…"
          />
          {fieldErrors.video_url ? (
            <span className="field-error">{fieldErrors.video_url}</span>
          ) : null}
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_free_preview}
            onChange={(e) => setField('is_free_preview', e.target.checked)}
          />
          Free preview (unlocked without purchase)
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
          />
          Published (active)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : chapter ? 'Update Chapter' : 'Add Chapter'}
        </button>
      </div>
    </form>
  );
}
