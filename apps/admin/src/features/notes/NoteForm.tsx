/**
 * Create / edit note — paste HTTPS notes URL, assign course + chapter.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Chapter, CourseSummary, Note } from '@sharanam/shared';

import {
  createAdminNote,
  fetchChaptersForCourse,
  isSafeNotesUrlClient,
  updateAdminNote,
  type NoteWritePayload,
} from '@/features/notes/api';
import { ApiClientError } from '@/services/api';

type NoteFormProps = {
  note: Note | null;
  courses: CourseSummary[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  notes_url: string;
  sort_order: string;
  is_free: boolean;
  is_published: boolean;
};

function fromNote(note: Note | null, defaultCourseId: string): FormState {
  if (!note) {
    return {
      course_id: defaultCourseId,
      chapter_id: '',
      title: '',
      description: '',
      notes_url: '',
      sort_order: '0',
      is_free: false,
      is_published: true,
    };
  }
  return {
    course_id: note.course_id,
    chapter_id: note.chapter_id,
    title: note.title,
    description: note.description ?? '',
    notes_url: note.notes_url,
    sort_order: String(note.sort_order ?? 0),
    is_free: note.is_free,
    is_published: note.is_published,
  };
}

export function NoteForm({ note, courses, onSaved, onCancel }: NoteFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    fromNote(note, courses[0]?.id ?? ''),
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    setForm(fromNote(note, courses[0]?.id ?? ''));
    setError(null);
    setFieldErrors({});
  }, [note, courses]);

  useEffect(() => {
    if (!form.course_id) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    void fetchChaptersForCourse(form.course_id)
      .then((list) => {
        if (cancelled) return;
        setChapters(list);
        setForm((prev) => {
          if (prev.chapter_id && list.some((c) => c.id === prev.chapter_id)) {
            return prev;
          }
          return { ...prev, chapter_id: list[0]?.id ?? '' };
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load chapters');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.course_id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.course_id) next.course_id = 'Select a course';
    if (!form.chapter_id) next.chapter_id = 'Select a chapter';
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!isSafeNotesUrlClient(form.notes_url)) {
      next.notes_url = 'Paste a valid public HTTPS notes URL';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const payload: NoteWritePayload = {
      course_id: form.course_id,
      chapter_id: form.chapter_id,
      title: form.title.trim(),
      description: form.description.trim(),
      notes_url: form.notes_url.trim(),
      sort_order: Number(form.sort_order) || 0,
      is_free: form.is_free,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (note) {
        await updateAdminNote(note.id, payload);
      } else {
        await createAdminNote(payload);
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
        <h2>{note ? 'Update Note' : 'Create Note'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label>
          Course *
          <select
            value={form.course_id}
            onChange={(e) => setField('course_id', e.target.value)}
            required
          >
            <option value="">Select course…</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {fieldErrors.course_id ? (
            <span className="field-error">{fieldErrors.course_id}</span>
          ) : null}
        </label>

        <label>
          Chapter *
          <select
            value={form.chapter_id}
            onChange={(e) => setField('chapter_id', e.target.value)}
            required
            disabled={!form.course_id || loadingChapters}
          >
            <option value="">
              {loadingChapters ? 'Loading chapters…' : 'Select chapter…'}
            </option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                Chapter {chapter.chapter_number} · {chapter.title}
              </option>
            ))}
          </select>
          {fieldErrors.chapter_id ? (
            <span className="field-error">{fieldErrors.chapter_id}</span>
          ) : null}
        </label>

        <label className="span-2">
          Title *
          <input
            required
            minLength={2}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Class Notes — Real Numbers"
          />
          {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
        </label>

        <label className="span-2">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Optional short description"
          />
        </label>

        <label className="span-2">
          Notes URL *
          <input
            required
            type="url"
            placeholder="https://docs.google.com/… or https://notion.so/…"
            value={form.notes_url}
            onChange={(e) => setField('notes_url', e.target.value)}
          />
          {fieldErrors.notes_url ? (
            <span className="field-error">{fieldErrors.notes_url}</span>
          ) : (
            <span className="hint">HTTPS only. Google Docs, Notion, Drive, or similar public links.</span>
          )}
        </label>

        <label>
          Sort Order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setField('sort_order', e.target.value)}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => setField('is_free', e.target.checked)}
          />
          Free Preview
        </label>

        <label className="checkbox span-2">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
          />
          Published (visible in student app)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
