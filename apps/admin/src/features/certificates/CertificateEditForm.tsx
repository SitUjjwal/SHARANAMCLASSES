/**
 * Edit certificate fields (student name, course title on PDF, description).
 */
import { FormEvent, useEffect, useState } from 'react';

import { updateAdminCertificate } from '@/features/certificates/api';
import { ApiClientError } from '@/services/api';
import type { AdminCertificate } from '@sharanam/shared';

type CertificateEditFormProps = {
  certificate: AdminCertificate;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  student_name: string;
  course_title: string;
  description: string;
  regenerate_pdf: boolean;
};

function courseLabel(cert: AdminCertificate): string {
  if (cert.course_title?.trim()) return cert.course_title.trim();
  return cert.title.replace(/^Certificate — /, '').trim() || '';
}

function fromCertificate(cert: AdminCertificate): FormState {
  return {
    student_name: cert.student_name || '',
    course_title: courseLabel(cert),
    description: cert.description || '',
    regenerate_pdf: cert.status === 'issued',
  };
}

export function CertificateEditForm({
  certificate,
  onSaved,
  onCancel,
}: CertificateEditFormProps) {
  const [form, setForm] = useState<FormState>(() => fromCertificate(certificate));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromCertificate(certificate));
    setError(null);
  }, [certificate]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateAdminCertificate(certificate.id, {
        student_name: form.student_name.trim(),
        course_title: form.course_title.trim(),
        description: form.description.trim(),
        regenerate_pdf: form.regenerate_pdf,
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
      <h3 style={{ marginTop: 0 }}>Edit certificate</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        {certificate.status === 'issued'
          ? 'Issued certificates keep the same Certificate ID. Saving regenerates the PDF.'
          : 'Updates the name/course shown when this certificate is approved.'}
      </p>

      <div className="form-grid">
        <label>
          Student name
          <input
            value={form.student_name}
            onChange={(e) => setField('student_name', e.target.value)}
            required
            maxLength={120}
          />
        </label>
        <label>
          Course title (on PDF)
          <input
            value={form.course_title}
            onChange={(e) => setField('course_title', e.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="span-2">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </label>
        {certificate.status === 'issued' ? (
          <label className="checkbox span-2">
            <input
              type="checkbox"
              checked={form.regenerate_pdf}
              onChange={(e) => setField('regenerate_pdf', e.target.checked)}
            />
            Regenerate PDF after save
          </label>
        ) : null}
      </div>

      {certificate.certificate_number ? (
        <p className="hint">Certificate ID: {certificate.certificate_number}</p>
      ) : null}
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
