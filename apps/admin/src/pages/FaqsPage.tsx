/**
 * FAQs admin — Create / Edit / Delete / Sort (move up/down).
 */
import { useCallback, useEffect, useState } from 'react';

import type { Faq } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { FaqForm } from '@/features/faqs/FaqForm';
import {
  deleteAdminFaq,
  fetchAdminFaqs,
  reorderAdminFaqs,
  updateAdminFaq,
} from '@/features/faqs/api';
import { ApiClientError } from '@/services/api';

export function FaqsPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminFaqs());
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(item: Faq) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function onDelete(item: Faq) {
    const ok = window.confirm(`Delete FAQ “${item.question.slice(0, 80)}”?`);
    if (!ok) return;
    try {
      await deleteAdminFaq(item.id);
      setMessage('FAQ deleted');
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    if (!row) return;
    next.splice(nextIndex, 0, row);
    setItems(next);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const reordered = await reorderAdminFaqs(next.map((f) => f.id));
      setItems(reordered);
      setMessage('Order saved');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Reorder failed');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(item: Faq) {
    try {
      await updateAdminFaq(item.id, { is_published: !item.is_published });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Update failed');
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="FAQs"
        description="Create, edit, delete, and sort help-center questions. Students can search published FAQs."
      />

      <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Create FAQ
        </button>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && items.length === 0 ? <p className="hint">No FAQs yet.</p> : null}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Sort</th>
              <th>Question</th>
              <th>Category</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy || index === 0}
                      onClick={() => void move(index, -1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy || index === items.length - 1}
                      onClick={() => void move(index, 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="hint">{item.sort_order}</div>
                </td>
                <td style={{ maxWidth: 420 }}>
                  <div>{item.question}</div>
                  <div className="hint" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.answer.slice(0, 140)}
                    {item.answer.length > 140 ? '…' : ''}
                  </div>
                </td>
                <td>{item.category || '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void togglePublished(item)}
                  >
                    {item.is_published ? 'Yes' : 'No'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void onDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editorOpen ? (
        <FaqForm
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setMessage(editing ? 'FAQ updated' : 'FAQ created');
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
