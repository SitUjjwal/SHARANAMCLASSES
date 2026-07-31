/**
 * Add / edit / delete videos, PDFs, and notes for one chapter.
 * Notes & PDFs support file upload (not only URL / text).
 */
import { FormEvent, useCallback, useEffect, useState } from 'react';

import type { Chapter, ChapterContentItem, ChapterContentType } from '@sharanam/shared';

import {
  createChapterContent,
  deleteChapterContent,
  fetchChapterContents,
  updateChapterContent,
  uploadChapterMaterial,
  type ChapterContentWritePayload,
} from '@/features/chapters/api';
import { ApiClientError } from '@/services/api';

type ChapterContentPanelProps = {
  chapter: Chapter;
  onClose: () => void;
  onChanged: () => void;
};

type FormState = {
  content_type: ChapterContentType;
  title: string;
  url: string;
  body: string;
  duration_seconds: string;
};

const emptyForm = (): FormState => ({
  content_type: 'note',
  title: '',
  url: '',
  body: '',
  duration_seconds: '0',
});

function typeLabel(type: ChapterContentType): string {
  if (type === 'video') return 'Video';
  if (type === 'pdf') return 'PDF';
  return 'Notes';
}

export function ChapterContentPanel({ chapter, onClose, onChanged }: ChapterContentPanelProps) {
  const [items, setItems] = useState<ChapterContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchChapterContents(chapter.id));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [chapter.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(item: ChapterContentItem) {
    setEditingId(item.id);
    setFileName(null);
    setForm({
      content_type: item.content_type,
      title: item.title,
      url: item.url ?? '',
      body: item.body ?? '',
      duration_seconds: String(item.duration_seconds ?? 0),
    });
  }

  function resetForm() {
    setEditingId(null);
    setFileName(null);
    setForm(emptyForm());
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadChapterMaterial(file);
      setForm((prev) => ({
        ...prev,
        url,
        title: prev.title.trim() || file.name.replace(/\.[^.]+$/, ''),
        content_type: prev.content_type === 'video' ? 'note' : prev.content_type,
      }));
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (form.content_type === 'note' && !form.url.trim() && !form.body.trim()) {
      setError('Notes ke liye file upload karo ya text likho');
      return;
    }
    if ((form.content_type === 'video' || form.content_type === 'pdf') && !form.url.trim()) {
      setError(`${typeLabel(form.content_type)} ke liye URL / upload zaroori hai`);
      return;
    }

    const payload: ChapterContentWritePayload = {
      content_type: form.content_type,
      title: form.title.trim(),
      url: form.url.trim() || null,
      body: form.body.trim() || null,
      duration_seconds: Number(form.duration_seconds) || null,
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateChapterContent(editingId, payload);
      } else {
        await createChapterContent(chapter.id, payload);
      }
      resetForm();
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: ChapterContentItem) {
    const ok = window.confirm(`Delete “${item.title}”?`);
    if (!ok) return;
    try {
      await deleteChapterContent(item.id);
      if (editingId === item.id) resetForm();
      await load();
      onChanged();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  const showUpload = form.content_type === 'note' || form.content_type === 'pdf';

  return (
    <div className="course-form">
      <div className="course-form-head">
        <div>
          <h2>Videos & Notes</h2>
          <p className="hint" style={{ marginTop: '0.25rem' }}>
            {chapter.title} — video link, PDF upload, ya notes file / text add karo.
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">Abhi kuch nahi hai. Neeche Notes / PDF upload karke add karo.</p>
      ) : null}

      <ul className="content-item-list">
        {items.map((item) => (
          <li key={item.id} className="content-item-row">
            <div>
              <strong>
                [{typeLabel(item.content_type)}] {item.title}
              </strong>
              <span>
                {item.url ? item.url : item.body?.slice(0, 80) || '—'}
                {item.duration_seconds ? ` · ${Math.round(item.duration_seconds / 60)}m` : ''}
              </span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => startEdit(item)}>
                Edit
              </button>
              <button type="button" className="btn danger" onClick={() => void onDelete(item)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form className="content-add-form" onSubmit={onSubmit}>
        <h3>{editingId ? 'Edit content' : 'Add content'}</h3>

        <div className="content-type-tabs" role="group" aria-label="Content type">
          {(['note', 'pdf', 'video'] as ChapterContentType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`content-type-tab${form.content_type === type ? ' is-active' : ''}`}
              disabled={Boolean(editingId)}
              onClick={() => {
                setForm((prev) => ({ ...prev, content_type: type }));
                setFileName(null);
              }}
            >
              {typeLabel(type)}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label className="span-2">
            Title *
            <input
              required
              minLength={2}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          {showUpload ? (
            <label className="span-2 file-upload-field">
              Upload file {form.content_type === 'note' ? '(PDF / DOC / TXT / image)' : '(PDF)'}
              <input
                type="file"
                accept={
                  form.content_type === 'pdf'
                    ? 'application/pdf,.pdf'
                    : '.pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp'
                }
                disabled={uploading}
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              />
              {uploading ? <span className="hint">Uploading…</span> : null}
              {fileName && !uploading ? (
                <span className="hint">Uploaded: {fileName}</span>
              ) : null}
              {form.url && !fileName ? (
                <span className="hint">Current file URL saved</span>
              ) : null}
            </label>
          ) : null}

          {form.content_type === 'video' ? (
            <>
              <label className="span-2">
                Video URL *
                <input
                  required
                  type="url"
                  placeholder="https://…"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                />
              </label>
              <label>
                Duration (seconds)
                <input
                  type="number"
                  min={0}
                  value={form.duration_seconds}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, duration_seconds: e.target.value }))
                  }
                />
              </label>
            </>
          ) : null}

          {form.content_type === 'pdf' && !form.url ? (
            <label className="span-2">
              Or paste PDF URL
              <input
                type="url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              />
            </label>
          ) : null}

          {form.content_type === 'note' ? (
            <label className="span-2">
              Notes text (optional if file uploaded)
              <textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Type notes here, or upload a file above…"
              />
            </label>
          ) : null}
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          {editingId ? (
            <button type="button" className="btn ghost" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
          <button type="submit" className="btn primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : editingId ? 'Update' : `Add ${typeLabel(form.content_type)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
