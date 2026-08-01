/**
 * Create / edit MCQ — four options, correct answer, marks, explanation.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Question, QuestionCorrectAnswer } from '@sharanam/shared';

import {
  createAdminQuestion,
  updateAdminQuestion,
  type QuestionWritePayload,
} from '@/features/questions/api';
import { ApiClientError } from '@/services/api';

type QuestionFormProps = {
  testId: string;
  question: Question | null;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: QuestionCorrectAnswer;
  explanation: string;
  marks: string;
  negative_marks: string;
  sort_order: string;
};

function fromQuestion(question: Question | null): FormState {
  if (!question) {
    return {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      marks: '1',
      negative_marks: '0',
      sort_order: '0',
    };
  }
  return {
    question_text: question.question_text,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    correct_answer: question.correct_answer,
    explanation: question.explanation ?? '',
    marks: String(question.marks),
    negative_marks: String(question.negative_marks),
    sort_order: String(question.sort_order ?? 0),
  };
}

export function QuestionForm({
  testId,
  question,
  onSaved,
  onCancel,
}: QuestionFormProps) {
  const [form, setForm] = useState<FormState>(() => fromQuestion(question));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromQuestion(question));
    setError(null);
    setFieldErrors({});
  }, [question]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.question_text.trim()) next.question_text = 'Question text is required';
    if (!form.option_a.trim()) next.option_a = 'Option A is required';
    if (!form.option_b.trim()) next.option_b = 'Option B is required';
    if (!form.option_c.trim()) next.option_c = 'Option C is required';
    if (!form.option_d.trim()) next.option_d = 'Option D is required';

    const marks = Number(form.marks);
    const negative = Number(form.negative_marks);
    if (!Number.isFinite(marks) || marks <= 0) {
      next.marks = 'Marks must be greater than 0';
    }
    if (!Number.isFinite(negative) || negative < 0) {
      next.negative_marks = 'Negative marks cannot be negative';
    } else if (Number.isFinite(marks) && negative > marks) {
      next.negative_marks = 'Negative marks cannot exceed marks';
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: QuestionWritePayload = {
      question_text: form.question_text.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
      correct_answer: form.correct_answer,
      explanation: form.explanation.trim(),
      marks: Number(form.marks),
      negative_marks: Number(form.negative_marks),
      sort_order: Number(form.sort_order) || 0,
    };

    setSaving(true);
    setError(null);
    try {
      if (question) {
        await updateAdminQuestion(question.id, payload);
      } else {
        await createAdminQuestion(testId, payload);
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
        <h2>{question ? 'Edit Question' : 'Add Question'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <label className="span-2">
        Question
        <textarea
          rows={3}
          value={form.question_text}
          onChange={(e) => setField('question_text', e.target.value)}
          placeholder="Enter the question stem"
        />
        {fieldErrors.question_text ? (
          <span className="field-error">{fieldErrors.question_text}</span>
        ) : null}
      </label>

      <div className="form-row">
        {(['a', 'b', 'c', 'd'] as const).map((key) => {
          const field = `option_${key}` as const;
          const label = `Option ${key.toUpperCase()}`;
          return (
            <label key={key}>
              {label}
              <input
                value={form[field]}
                onChange={(e) => setField(field, e.target.value)}
              />
              {fieldErrors[field] ? (
                <span className="field-error">{fieldErrors[field]}</span>
              ) : null}
            </label>
          );
        })}
      </div>

      <div className="form-row">
        <label>
          Correct answer
          <select
            value={form.correct_answer}
            onChange={(e) =>
              setField('correct_answer', e.target.value as QuestionCorrectAnswer)
            }
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>
        <label>
          Marks
          <input
            type="number"
            min={0.25}
            step="0.25"
            value={form.marks}
            onChange={(e) => setField('marks', e.target.value)}
          />
          {fieldErrors.marks ? (
            <span className="field-error">{fieldErrors.marks}</span>
          ) : null}
        </label>
        <label>
          Negative marks
          <input
            type="number"
            min={0}
            step="0.25"
            value={form.negative_marks}
            onChange={(e) => setField('negative_marks', e.target.value)}
          />
          {fieldErrors.negative_marks ? (
            <span className="field-error">{fieldErrors.negative_marks}</span>
          ) : null}
        </label>
        <label>
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setField('sort_order', e.target.value)}
          />
        </label>
      </div>

      <label className="span-2">
        Explanation
        <textarea
          rows={2}
          value={form.explanation}
          onChange={(e) => setField('explanation', e.target.value)}
          placeholder="Shown after the student submits (optional)"
        />
      </label>

      <footer className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : question ? 'Save changes' : 'Add question'}
        </button>
      </footer>
    </form>
  );
}
