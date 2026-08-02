/**
 * FAQ create / edit form modal.
 */
import { useState } from 'react';

import type { Faq } from '@sharanam/shared';

import {
  createAdminFaq,
  updateAdminFaq,
} from '@/features/faqs/api';
import { ApiClientError } from '@/services/api';

type Props = {
  initial: Faq | null;
  onClose: () => void;
  onSaved: () => void;
};

export function FaqForm({ initial, onClose, onSaved }: Props) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (question.trim().length < 3 || answer.trim().length < 3) {
      setError('Question and answer must be at least 3 characters.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim() || null,
        is_published: isPublished,
      };
      if (initial) {
        await updateAdminFaq(initial.id, payload);
      } else {
        await createAdminFaq(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2>{initial ? 'Edit FAQ' : 'Create FAQ'}</h2>
        <form onSubmit={(ev) => void onSubmit(ev)} className="form-grid">
          <label className="span-2">
            Question
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={300}
            />
          </label>
          <label className="span-2">
            Answer
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={6}
              maxLength={8000}
            />
          </label>
          <label>
            Category (optional)
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="courses, payments, account…"
              maxLength={80}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Published (visible to students)
          </label>
          {error ? <p className="form-error span-2">{error}</p> : null}
          <div className="span-2" style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
