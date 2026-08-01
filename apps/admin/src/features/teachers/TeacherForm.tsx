/**
 * Create / edit teacher (instructor profile).
 */
import { FormEvent, useEffect, useState } from 'react';

import {
  createAdminTeacher,
  updateAdminTeacher,
  type TeacherRecord,
} from '@/features/teachers/api';
import { ApiClientError } from '@/services/api';

type TeacherFormProps = {
  teacher: TeacherRecord | null;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
};

function fromTeacher(teacher: TeacherRecord | null): FormState {
  if (!teacher) {
    return { full_name: '', email: '', phone_number: '', password: '' };
  }
  return {
    full_name: teacher.full_name,
    email: teacher.email,
    phone_number: teacher.phone_number ?? '',
    password: '',
  };
}

export function TeacherForm({ teacher, onSaved, onCancel }: TeacherFormProps) {
  const [form, setForm] = useState<FormState>(() => fromTeacher(teacher));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromTeacher(teacher));
    setError(null);
  }, [teacher]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (teacher) {
        await updateAdminTeacher(teacher.id, {
          full_name: form.full_name.trim(),
          phone_number: form.phone_number.trim(),
        });
      } else {
        await createAdminTeacher({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          promote_if_exists: true,
        });
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
        <h2>{teacher ? 'Edit Teacher' : 'Add Teacher'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label className="span-2">
          Full name *
          <input
            required
            minLength={2}
            value={form.full_name}
            onChange={(e) => setField('full_name', e.target.value)}
            placeholder="Teacher display name"
          />
        </label>

        <label className="span-2">
          Email *
          <input
            required
            type="email"
            disabled={Boolean(teacher)}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="teacher@example.com"
          />
        </label>

        <label className="span-2">
          Phone *
          <input
            required
            minLength={10}
            value={form.phone_number}
            onChange={(e) => setField('phone_number', e.target.value)}
            placeholder="10-digit mobile"
          />
        </label>

        {!teacher ? (
          <label className="span-2">
            Temporary password *
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
          </label>
        ) : null}
      </div>

      {!teacher ? (
        <p className="hint">
          Creates an instructor login. If the email already belongs to a student, that
          account is promoted to instructor.
        </p>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : teacher ? 'Update Teacher' : 'Add Teacher'}
        </button>
      </div>
    </form>
  );
}
