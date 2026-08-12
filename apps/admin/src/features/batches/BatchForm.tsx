/**
 * Batch create / edit form — validation mirrored from API rules.
 * A batch is a course row with class/board/medium/year + pricing window.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';

import type { CourseSummary } from '@sharanam/shared';

import {
  slugifyTitle,
  uploadCourseThumbnail,
  type TeacherOption,
} from '@/features/courses/api';
import { createBatch, updateBatch, type BatchWritePayload } from '@/features/batches/api';
import { ApiClientError } from '@/services/api';

const CLASS_LEVELS = ['8', '9', '10', '11', '12'] as const;

type BatchFormProps = {
  batch: CourseSummary | null;
  teachers: TeacherOption[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  board: string;
  class_level: string;
  academic_year: string;
  medium: string;
  stream: string;
  teacher_id: string;
  thumbnail_url: string;
  price: string;
  original_price: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
};

function fromBatch(batch: CourseSummary | null): FormState {
  if (!batch) {
    return {
      title: '',
      slug: '',
      description: '',
      board: 'bihar_board',
      class_level: '10',
      academic_year: '2026-2027',
      medium: 'hindi',
      stream: '',
      teacher_id: '',
      thumbnail_url: '',
      price: '0',
      original_price: '',
      start_date: '',
      end_date: '',
      is_published: false,
    };
  }

  return {
    title: batch.title,
    slug: batch.slug,
    description: batch.description ?? '',
    board: batch.board ?? 'bihar_board',
    class_level: batch.class_level ?? '',
    academic_year: batch.academic_year ?? '',
    medium: batch.medium ?? '',
    stream: batch.stream ?? '',
    teacher_id: batch.teacher_id ?? '',
    thumbnail_url: batch.thumbnail_url ?? '',
    price: String(batch.price ?? 0),
    original_price:
      batch.original_price != null && batch.original_price > 0
        ? String(batch.original_price)
        : '',
    start_date: batch.start_date ?? '',
    end_date: batch.end_date ?? '',
    is_published: batch.is_published,
  };
}

export function BatchForm({ batch, teachers, onSaved, onCancel }: BatchFormProps) {
  const [form, setForm] = useState<FormState>(() => fromBatch(batch));
  const [slugTouched, setSlugTouched] = useState(Boolean(batch));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromBatch(batch));
    setSlugTouched(Boolean(batch));
    setError(null);
    setFieldErrors({});
  }, [batch]);

  const titleHeading = useMemo(() => (batch ? 'Update Batch' : 'Create Batch'), [batch]);

  const needsStream = form.class_level === '11' || form.class_level === '12';

  const price = Number(form.price);
  const originalPrice = form.original_price.trim() ? Number(form.original_price) : null;
  const discountPercent =
    originalPrice != null && originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugTouched) {
        next.slug = slugifyTitle(String(value));
      }
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = 'Batch name must be at least 2 characters';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      next.slug = 'Slug must be kebab-case (e.g. class-10-batch-2026-27)';
    }
    if (!form.class_level) next.class_level = 'Class is required';
    if (!form.medium) next.medium = 'Medium is required';
    if (!form.academic_year.trim()) next.academic_year = 'Academic year is required';
    if (needsStream && !form.stream) next.stream = 'Stream is required for class 11/12';
    if (Number.isNaN(price) || price < 0) next.price = 'Price must be 0 or greater';
    if (form.original_price.trim()) {
      if (originalPrice == null || Number.isNaN(originalPrice) || originalPrice < 0) {
        next.original_price = 'Original price must be a number ≥ 0';
      } else if (originalPrice < price) {
        next.original_price = 'Original price must be greater than or equal to price';
      }
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      next.end_date = 'End date must be after start date';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCourseThumbnail(file);
      setField('thumbnail_url', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const payload: BatchWritePayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      board: (form.board as 'bihar_board' | 'other') || 'bihar_board',
      class_level: form.class_level,
      academic_year: form.academic_year.trim(),
      medium: (form.medium as 'hindi' | 'english') || null,
      stream: needsStream
        ? ((form.stream as 'science' | 'arts' | 'commerce') || null)
        : null,
      teacher_id: form.teacher_id || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      price,
      original_price: originalPrice,
      discount_percent: discountPercent,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (batch) {
        await updateBatch(batch.id, payload);
      } else {
        await createBatch(payload);
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
        <h2>{titleHeading}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label>
          Batch name *
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Class 10 Bihar Board Batch 2026-27"
            required
          />
          {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
        </label>

        <label>
          Slug *
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setField('slug', e.target.value);
            }}
            required
          />
          {fieldErrors.slug ? <span className="field-error">{fieldErrors.slug}</span> : null}
        </label>

        <label>
          Board
          <select value={form.board} onChange={(e) => setField('board', e.target.value)}>
            <option value="bihar_board">Bihar Board</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Class *
          <select
            value={form.class_level}
            onChange={(e) => {
              const level = e.target.value;
              setForm((prev) => ({
                ...prev,
                class_level: level,
                stream: level === '11' || level === '12' ? prev.stream : '',
              }));
            }}
          >
            <option value="">—</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                Class {level}
              </option>
            ))}
          </select>
          {fieldErrors.class_level ? (
            <span className="field-error">{fieldErrors.class_level}</span>
          ) : null}
        </label>

        <label>
          Academic year *
          <input
            value={form.academic_year}
            onChange={(e) => setField('academic_year', e.target.value)}
            placeholder="2026-2027"
            required
          />
          {fieldErrors.academic_year ? (
            <span className="field-error">{fieldErrors.academic_year}</span>
          ) : null}
        </label>

        <label>
          Medium *
          <select value={form.medium} onChange={(e) => setField('medium', e.target.value)}>
            <option value="">—</option>
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
          {fieldErrors.medium ? <span className="field-error">{fieldErrors.medium}</span> : null}
        </label>

        {needsStream ? (
          <label>
            Stream *
            <select value={form.stream} onChange={(e) => setField('stream', e.target.value)}>
              <option value="">—</option>
              <option value="science">Science</option>
              <option value="arts">Arts</option>
              <option value="commerce">Commerce</option>
            </select>
            {fieldErrors.stream ? <span className="field-error">{fieldErrors.stream}</span> : null}
          </label>
        ) : null}

        <label>
          Teacher
          <select value={form.teacher_id} onChange={(e) => setField('teacher_id', e.target.value)}>
            <option value="">— Select teacher —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="span-2">
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </label>

        <label>
          Batch price (₹) *
          <input
            type="number"
            min={0}
            step={1}
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
          />
          {fieldErrors.price ? <span className="field-error">{fieldErrors.price}</span> : null}
        </label>

        <label>
          Original price (₹, MRP)
          <input
            type="number"
            min={0}
            step={1}
            value={form.original_price}
            onChange={(e) => setField('original_price', e.target.value)}
            placeholder="Optional strike-through price"
          />
          {discountPercent != null ? (
            <span className="hint">Discount: {discountPercent}% off</span>
          ) : null}
          {fieldErrors.original_price ? (
            <span className="field-error">{fieldErrors.original_price}</span>
          ) : null}
        </label>

        <label>
          Start date
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setField('start_date', e.target.value)}
          />
        </label>

        <label>
          End date
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setField('end_date', e.target.value)}
          />
          {fieldErrors.end_date ? (
            <span className="field-error">{fieldErrors.end_date}</span>
          ) : null}
        </label>

        <label>
          Status
          <select
            value={form.is_published ? 'published' : 'draft'}
            onChange={(e) => setField('is_published', e.target.value === 'published')}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <div className="span-2 thumbnail-field">
          <span>Batch thumbnail</span>
          {form.thumbnail_url ? (
            <img src={form.thumbnail_url} alt="" className="thumb-preview" />
          ) : null}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          <input
            placeholder="Or paste image URL"
            value={form.thumbnail_url}
            onChange={(e) => setField('thumbnail_url', e.target.value)}
          />
          {uploading ? <small>Uploading…</small> : null}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : batch ? 'Update Batch' : 'Create Batch'}
        </button>
      </div>
    </form>
  );
}
