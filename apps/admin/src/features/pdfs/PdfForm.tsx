/**
 * Create / edit PDF — upload to R2 via API, assign course + chapter.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Chapter, CourseSummary, Pdf } from '@sharanam/shared';

import {
  createAdminPdf,
  fetchChaptersForCourse,
  formatFileSize,
  updateAdminPdf,
  uploadAdminPdf,
  type PdfUploadResult,
  type PdfWritePayload,
} from '@/features/pdfs/api';
import { ApiClientError } from '@/services/api';

type PdfFormProps = {
  pdf: Pdf | null;
  courses: CourseSummary[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_key: string;
  file_size: number;
  original_filename: string;
  sort_order: string;
  is_free: boolean;
  is_published: boolean;
};

function fromPdf(pdf: Pdf | null, defaultCourseId: string): FormState {
  if (!pdf) {
    return {
      course_id: defaultCourseId,
      chapter_id: '',
      title: '',
      description: '',
      file_url: '',
      storage_key: '',
      file_size: 0,
      original_filename: '',
      sort_order: '0',
      is_free: false,
      is_published: true,
    };
  }
  return {
    course_id: pdf.course_id,
    chapter_id: pdf.chapter_id,
    title: pdf.title,
    description: pdf.description ?? '',
    file_url: pdf.file_url,
    storage_key: pdf.storage_key,
    file_size: pdf.file_size,
    original_filename: pdf.original_filename,
    sort_order: String(pdf.sort_order ?? 0),
    is_free: pdf.is_free,
    is_published: pdf.is_published,
  };
}

export function PdfForm({ pdf, courses, onSaved, onCancel }: PdfFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    fromPdf(pdf, courses[0]?.id ?? ''),
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [fileReplaced, setFileReplaced] = useState(false);

  useEffect(() => {
    setForm(fromPdf(pdf, courses[0]?.id ?? ''));
    setError(null);
    setFieldErrors({});
    setFileReplaced(false);
  }, [pdf, courses]);

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

  function applyUpload(meta: PdfUploadResult) {
    setForm((prev) => ({
      ...prev,
      file_url: meta.file_url,
      storage_key: meta.storage_key,
      file_size: meta.file_size,
      original_filename: meta.original_filename,
      title: prev.title.trim() ? prev.title : meta.original_filename.replace(/\.pdf$/i, ''),
    }));
    setFileReplaced(true);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('PDF must be 25MB or smaller');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const meta = await uploadAdminPdf(file);
      applyUpload(meta);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'PDF upload failed');
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.course_id) next.course_id = 'Select a course';
    if (!form.chapter_id) next.chapter_id = 'Select a chapter';
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!form.file_url || !form.storage_key) {
      next.file = 'Upload a PDF before saving';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const base: PdfWritePayload = {
      course_id: form.course_id,
      chapter_id: form.chapter_id,
      title: form.title.trim(),
      description: form.description.trim(),
      file_url: form.file_url,
      storage_key: form.storage_key,
      file_size: form.file_size,
      mime_type: 'application/pdf',
      original_filename: form.original_filename || 'document.pdf',
      sort_order: Number(form.sort_order) || 0,
      is_free: form.is_free,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (pdf) {
        const patch: Partial<PdfWritePayload> = {
          course_id: base.course_id,
          chapter_id: base.chapter_id,
          title: base.title,
          description: base.description,
          sort_order: base.sort_order,
          is_free: base.is_free,
          is_published: base.is_published,
        };
        if (fileReplaced) {
          patch.file_url = base.file_url;
          patch.storage_key = base.storage_key;
          patch.file_size = base.file_size;
          patch.mime_type = base.mime_type;
          patch.original_filename = base.original_filename;
        }
        await updateAdminPdf(pdf.id, patch);
      } else {
        await createAdminPdf(base);
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
        <h2>{pdf ? 'Update PDF' : 'Create PDF'}</h2>
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
            placeholder="e.g. Chapter 1 Notes"
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

        <label className="span-2 file-upload-field">
          PDF File *
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          {uploading ? <span className="hint">Uploading to storage…</span> : null}
          {fieldErrors.file ? <span className="field-error">{fieldErrors.file}</span> : null}
          {form.file_url ? (
            <span className="hint">
              {form.original_filename || 'document.pdf'} · {formatFileSize(form.file_size)}
              {fileReplaced ? ' · new upload' : ''}
            </span>
          ) : (
            <span className="hint">Max 25MB. Binary goes to Cloudflare R2; only the URL is saved.</span>
          )}
        </label>

        {form.file_url ? (
          <label className="span-2">
            Stored URL
            <input type="url" value={form.file_url} readOnly />
          </label>
        ) : null}

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
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
