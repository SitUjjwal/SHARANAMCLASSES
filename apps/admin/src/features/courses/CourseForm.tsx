/**
 * Course create / edit form — validation mirrored from API Zod rules.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';

import type { Category, CourseSummary } from '@sharanam/shared';

import {
  createAdminCourse,
  slugifyTitle,
  updateAdminCourse,
  uploadCourseThumbnail,
  type CourseWritePayload,
  type TeacherOption,
} from '@/features/courses/api';
import { ApiClientError } from '@/services/api';

const CLASS_LEVELS = [
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'competitive',
  'computer',
] as const;

type CourseFormProps = {
  course: CourseSummary | null;
  categories: Category[];
  teachers: TeacherOption[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  category_id: string;
  teacher_name: string;
  thumbnail_url: string;
  class_level: string;
  medium: string;
  price: string;
  is_free: boolean;
  is_published: boolean;
  is_featured: boolean;
  sort_order: string;
};

function fromCourse(course: CourseSummary | null): FormState {
  if (!course) {
    return {
      title: '',
      slug: '',
      description: '',
      category_id: '',
      teacher_name: '',
      thumbnail_url: '',
      class_level: '10',
      medium: 'hindi',
      price: '0',
      is_free: false,
      is_published: false,
      is_featured: false,
      sort_order: '0',
    };
  }

  return {
    title: course.title,
    slug: course.slug,
    description: course.description ?? '',
    category_id: course.category_id ?? '',
    teacher_name: course.teacher_name ?? '',
    thumbnail_url: course.thumbnail_url ?? '',
    class_level: course.class_level ?? '',
    medium: course.medium ?? '',
    price: String(course.price ?? 0),
    is_free: course.is_free,
    is_published: course.is_published,
    is_featured: course.is_featured,
    sort_order: String(course.sort_order ?? 0),
  };
}

export function CourseForm({
  course,
  categories,
  teachers,
  onSaved,
  onCancel,
}: CourseFormProps) {
  const [form, setForm] = useState<FormState>(() => fromCourse(course));
  const [slugTouched, setSlugTouched] = useState(Boolean(course));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(fromCourse(course));
    setSlugTouched(Boolean(course));
    setError(null);
    setFieldErrors({});
  }, [course]);

  const titleHeading = useMemo(
    () => (course ? 'Update Course' : 'Create Course'),
    [course],
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugTouched) {
        next.slug = slugifyTitle(String(value));
      }
      if (key === 'is_free' && value === true) {
        next.price = '0';
      }
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      next.slug = 'Slug must be kebab-case (e.g. class-10-maths)';
    }
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) next.price = 'Price must be 0 or greater';
    if (!form.is_free && price <= 0) next.price = 'Paid courses need a price greater than 0';
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

    const payload: CourseWritePayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      category_id: form.category_id || null,
      teacher_name: form.teacher_name.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      class_level: form.class_level || null,
      medium: (form.medium as 'hindi' | 'english') || null,
      price: form.is_free ? 0 : Number(form.price),
      is_free: form.is_free,
      is_published: form.is_published,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    };

    setSaving(true);
    setError(null);
    try {
      if (course) {
        await updateAdminCourse(course.id, payload);
      } else {
        await createAdminCourse(payload);
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
          Course name *
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
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

        <label className="span-2">
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </label>

        <label>
          Category
          <select
            value={form.category_id}
            onChange={(e) => setField('category_id', e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {!category.is_active ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Teacher
          <select
            value={form.teacher_name}
            onChange={(e) => setField('teacher_name', e.target.value)}
          >
            <option value="">— Select teacher —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.full_name}>
                {teacher.full_name}
              </option>
            ))}
          </select>
          <input
            className="mt-sm"
            placeholder="Or type teacher name"
            value={form.teacher_name}
            onChange={(e) => setField('teacher_name', e.target.value)}
          />
        </label>

        <label>
          Class level
          <select
            value={form.class_level}
            onChange={(e) => setField('class_level', e.target.value)}
          >
            <option value="">—</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label>
          Medium
          <select value={form.medium} onChange={(e) => setField('medium', e.target.value)}>
            <option value="">—</option>
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
        </label>

        <label>
          Pricing
          <select
            value={form.is_free ? 'free' : 'paid'}
            onChange={(e) => setField('is_free', e.target.value === 'free')}
          >
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        </label>

        <label>
          Price (₹)
          <input
            type="number"
            min={0}
            step={1}
            disabled={form.is_free}
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
          />
          {fieldErrors.price ? <span className="field-error">{fieldErrors.price}</span> : null}
        </label>

        <label>
          Status
          <select
            value={form.is_published ? 'active' : 'inactive'}
            onChange={(e) => setField('is_published', e.target.value === 'active')}
          >
            <option value="active">Active (published)</option>
            <option value="inactive">Inactive (draft)</option>
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

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setField('is_featured', e.target.checked)}
          />
          Featured on Home
        </label>

        <div className="span-2 thumbnail-field">
          <span>Thumbnail</span>
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
          {saving ? 'Saving…' : course ? 'Update Course' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}
