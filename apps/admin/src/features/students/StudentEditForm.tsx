/**
 * Edit student profile fields (admin).
 */
import { FormEvent, useEffect, useState } from 'react';

import {
  updateAdminStudent,
  type AdminStudent,
} from '@/features/students/api';
import { ApiClientError } from '@/services/api';

const CLASS_OPTIONS = [
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

type StudentEditFormProps = {
  student: AdminStudent;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  full_name: string;
  phone_number: string;
  class_level: string;
  medium: 'hindi' | 'english';
};

function fromStudent(student: AdminStudent): FormState {
  return {
    full_name: student.full_name,
    phone_number: student.phone_number,
    class_level: student.class_level || '10',
    medium: student.medium === 'english' ? 'english' : 'hindi',
  };
}

export function StudentEditForm({
  student,
  onSaved,
  onCancel,
}: StudentEditFormProps) {
  const [form, setForm] = useState<FormState>(() => fromStudent(student));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromStudent(student));
    setError(null);
  }, [student]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateAdminStudent(student.id, {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        class_level: form.class_level,
        medium: form.medium,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="course-form" onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0 }}>Edit student</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        {student.email} · {student.enrolled_courses} enrolled course
        {student.enrolled_courses === 1 ? '' : 's'}
      </p>

      <div className="form-grid">
        <label className="span-2">
          Full name
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone_number: e.target.value }))
            }
            required
            minLength={10}
            maxLength={15}
          />
        </label>
        <label>
          Class
          <select
            value={form.class_level}
            onChange={(e) =>
              setForm((f) => ({ ...f, class_level: e.target.value }))
            }
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Medium
          <select
            value={form.medium}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                medium: e.target.value as 'hindi' | 'english',
              }))
            }
          >
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
