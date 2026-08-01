/**
 * Create / edit test — type, course/chapter, duration, marks.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Chapter, CourseSummary, Test, TestType } from '@sharanam/shared';
import { TEST_TYPE_LABELS } from '@sharanam/shared';

import {
  createAdminTest,
  fetchChaptersForCourse,
  updateAdminTest,
  type TestWritePayload,
} from '@/features/tests/api';
import { ApiClientError } from '@/services/api';

type TestFormProps = {
  test: Test | null;
  courses: CourseSummary[];
  /** When creating from a course page — preselect and lock course */
  presetCourseId?: string;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  description: string;
  instructions: string;
  test_type: TestType;
  course_id: string;
  chapter_id: string;
  duration_minutes: string;
  total_marks: string;
  passing_marks: string;
  sort_order: string;
  is_free: boolean;
  is_published: boolean;
};

const TEST_TYPES = Object.keys(TEST_TYPE_LABELS) as TestType[];

function fromTest(test: Test | null, defaultCourseId: string): FormState {
  if (!test) {
    return {
      title: '',
      description: '',
      instructions: '',
      test_type: 'chapter_test',
      course_id: defaultCourseId,
      chapter_id: '',
      duration_minutes: '60',
      total_marks: '100',
      passing_marks: '33',
      sort_order: '0',
      is_free: false,
      is_published: false,
    };
  }
  return {
    title: test.title,
    description: test.description ?? '',
    instructions: test.instructions ?? '',
    test_type: test.test_type,
    course_id: test.course_id ?? '',
    chapter_id: test.chapter_id ?? '',
    duration_minutes: String(test.duration_minutes),
    total_marks: String(test.total_marks),
    passing_marks: String(test.passing_marks),
    sort_order: String(test.sort_order ?? 0),
    is_free: test.is_free,
    is_published: test.is_published,
  };
}

export function TestForm({
  test,
  courses,
  presetCourseId,
  onSaved,
  onCancel,
}: TestFormProps) {
  const defaultCourseId = presetCourseId || courses[0]?.id || '';
  const courseLocked = Boolean(presetCourseId) && !test;

  const [form, setForm] = useState<FormState>(() => fromTest(test, defaultCourseId));
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const needsChapter = form.test_type === 'chapter_test';
  const needsCourse =
    form.test_type === 'chapter_test' || form.test_type === 'subject_test';

  useEffect(() => {
    setForm(fromTest(test, defaultCourseId));
    setError(null);
    setFieldErrors({});
  }, [test, defaultCourseId]);

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
          if (!needsChapter) {
            return { ...prev, chapter_id: prev.chapter_id };
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
  }, [form.course_id, needsChapter]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (needsCourse && !form.course_id) next.course_id = 'Select a course';
    if (needsChapter && !form.chapter_id) next.chapter_id = 'Select a chapter';

    const duration = Number(form.duration_minutes);
    const total = Number(form.total_marks);
    const passing = Number(form.passing_marks);

    if (!Number.isFinite(duration) || duration < 1) {
      next.duration_minutes = 'Duration must be at least 1 minute';
    }
    if (!Number.isFinite(total) || total <= 0) {
      next.total_marks = 'Total marks must be greater than 0';
    }
    if (!Number.isFinite(passing) || passing <= 0) {
      next.passing_marks = 'Passing marks must be greater than 0';
    } else if (Number.isFinite(total) && passing > total) {
      next.passing_marks = 'Passing marks cannot exceed total marks';
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: TestWritePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      test_type: form.test_type,
      course_id: form.course_id || null,
      chapter_id: form.chapter_id || null,
      duration_minutes: Number(form.duration_minutes),
      total_marks: Number(form.total_marks),
      passing_marks: Number(form.passing_marks),
      sort_order: Number(form.sort_order) || 0,
      is_free: form.is_free,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (test) {
        await updateAdminTest(test.id, payload);
      } else {
        await createAdminTest(payload);
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
      <header className="modal-header">
        <h2>{test ? 'Edit Test' : 'Create Test'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <label>
        Test type
        <select
          value={form.test_type}
          onChange={(e) => setField('test_type', e.target.value as TestType)}
        >
          {TEST_TYPES.map((type) => (
            <option key={type} value={type}>
              {TEST_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Title
        <input
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="e.g. Real Numbers — Chapter Test"
        />
        {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
      </label>

      <label>
        Description
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </label>

      <label>
        Instructions
        <textarea
          rows={3}
          value={form.instructions}
          onChange={(e) => setField('instructions', e.target.value)}
          placeholder="Rules shown before the student starts"
        />
      </label>

      <div className="form-row">
        <label>
          Course {needsCourse ? '' : '(optional)'}
          <select
            value={form.course_id}
            disabled={courseLocked}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                course_id: e.target.value,
                chapter_id: '',
              }))
            }
          >
            <option value="">{needsCourse ? 'Select course' : 'No course'}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {courseLocked ? (
            <span className="hint">Locked to this course</span>
          ) : null}
          {fieldErrors.course_id ? (
            <span className="field-error">{fieldErrors.course_id}</span>
          ) : null}
        </label>

        <label>
          Chapter {needsChapter ? '' : '(optional)'}
          <select
            value={form.chapter_id}
            disabled={!form.course_id || loadingChapters}
            onChange={(e) => setField('chapter_id', e.target.value)}
          >
            <option value="">
              {loadingChapters
                ? 'Loading…'
                : needsChapter
                  ? 'Select chapter'
                  : 'No chapter'}
            </option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.title}
              </option>
            ))}
          </select>
          {fieldErrors.chapter_id ? (
            <span className="field-error">{fieldErrors.chapter_id}</span>
          ) : null}
        </label>
      </div>

      <div className="form-row">
        <label>
          Duration (minutes)
          <input
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => setField('duration_minutes', e.target.value)}
          />
          {fieldErrors.duration_minutes ? (
            <span className="field-error">{fieldErrors.duration_minutes}</span>
          ) : null}
        </label>
        <label>
          Total marks
          <input
            type="number"
            min={1}
            step="0.5"
            value={form.total_marks}
            onChange={(e) => setField('total_marks', e.target.value)}
          />
          {fieldErrors.total_marks ? (
            <span className="field-error">{fieldErrors.total_marks}</span>
          ) : null}
        </label>
        <label>
          Passing marks
          <input
            type="number"
            min={1}
            step="0.5"
            value={form.passing_marks}
            onChange={(e) => setField('passing_marks', e.target.value)}
          />
          {fieldErrors.passing_marks ? (
            <span className="field-error">{fieldErrors.passing_marks}</span>
          ) : null}
        </label>
      </div>

      <div className="form-row">
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
            checked={form.is_free}
            onChange={(e) => setField('is_free', e.target.checked)}
          />
          Free (no purchase required)
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
          />
          Published
        </label>
      </div>

      <footer className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : test ? 'Save changes' : 'Create test'}
        </button>
      </footer>
    </form>
  );
}
