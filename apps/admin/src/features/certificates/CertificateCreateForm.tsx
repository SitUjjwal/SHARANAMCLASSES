/**
 * Admin create certificate — pick student + course, optionally issue PDF now.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
  createAdminCertificate,
  searchCertificateStudents,
  type AdminStudentOption,
} from '@/features/certificates/api';
import { fetchAdminCourses } from '@/features/courses/api';
import { ApiClientError } from '@/services/api';
import type { CourseSummary } from '@sharanam/shared';

type CertificateCreateFormProps = {
  onSaved: () => void;
  onCancel: () => void;
};

export function CertificateCreateForm({
  onSaved,
  onCancel,
}: CertificateCreateFormProps) {
  const [studentQuery, setStudentQuery] = useState('');
  const [students, setStudents] = useState<AdminStudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentOption | null>(
    null,
  );
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseId, setCourseId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [issueNow, setIssueNow] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCourses(true);
    void fetchAdminCourses({ page: 1, pageSize: 100, status: 'all' })
      .then((page) => {
        if (!cancelled) setCourses(page.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoadingStudents(true);
      void searchCertificateStudents(studentQuery)
        .then(setStudents)
        .catch(() => setStudents([]))
        .finally(() => setLoadingStudents(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [studentQuery]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) ?? null,
    [courses, courseId],
  );

  useEffect(() => {
    if (selectedCourse) {
      setCourseTitle(selectedCourse.title);
    }
  }, [selectedCourse]);

  function pickStudent(student: AdminStudentOption) {
    setSelectedStudent(student);
    setStudentName(student.full_name);
    setStudentQuery(`${student.full_name} <${student.email}>`);
    setStudents([]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedStudent) {
      setError('Select a student from the search results');
      return;
    }
    if (!courseId && !courseTitle.trim()) {
      setError('Select a course or enter a course title');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createAdminCertificate({
        user_id: selectedStudent.id,
        course_id: courseId || null,
        student_name: studentName.trim() || selectedStudent.full_name,
        course_title: courseTitle.trim() || selectedCourse?.title,
        issue_now: issueNow,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="course-form" onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0 }}>Create certificate</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Choose a student and course. With “Issue now” checked, PDF + Certificate ID
        are generated immediately.
      </p>

      <div className="form-grid">
        <label className="span-2">
          Student
          <input
            value={studentQuery}
            onChange={(e) => {
              setStudentQuery(e.target.value);
              setSelectedStudent(null);
            }}
            placeholder="Search name or email"
            required
          />
        </label>
        {loadingStudents ? <p className="hint span-2">Searching…</p> : null}
        {!selectedStudent && students.length > 0 ? (
          <div className="span-2" style={{ display: 'grid', gap: 6 }}>
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn"
                style={{ textAlign: 'left' }}
                onClick={() => pickStudent(s)}
              >
                <strong>{s.full_name}</strong>
                <span className="hint"> · {s.email}</span>
                {s.class_level ? (
                  <span className="hint"> · Class {s.class_level}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        <label>
          Course
          <select
            value={courseId}
            onChange={(e) => {
              const id = e.target.value;
              setCourseId(id);
              const course = courses.find((c) => c.id === id);
              if (course) setCourseTitle(course.title);
            }}
            disabled={loadingCourses}
          >
            <option value="">Custom / no catalog course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Name on certificate
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            maxLength={120}
            required
          />
        </label>

        <label className="span-2">
          Course title on PDF
          <input
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            maxLength={200}
            required
            placeholder="e.g. Class 10 Mathematics"
          />
        </label>

        <label className="checkbox span-2">
          <input
            type="checkbox"
            checked={issueNow}
            onChange={(e) => setIssueNow(e.target.checked)}
          />
          Issue now (generate PDF + Certificate ID)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Creating…' : issueNow ? 'Create & issue' : 'Create pending'}
        </button>
      </div>
    </form>
  );
}
