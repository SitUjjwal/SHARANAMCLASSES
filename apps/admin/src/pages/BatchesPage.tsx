/**
 * Batch Management — Batch → Subject → Chapter architecture.
 * A batch is a sellable course container (e.g. "Class 10 Bihar Board Batch 2026-27").
 */
import { useCallback, useEffect, useState } from 'react';

import type { BatchSubject, CourseSummary } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  deleteBatch,
  fetchAdminBatches,
  type AdminBatchFilters,
} from '@/features/batches/api';
import { BatchForm } from '@/features/batches/BatchForm';
import { BatchSubjectsPanel } from '@/features/batches/BatchSubjectsPanel';
import { SubjectChaptersPanel } from '@/features/batches/SubjectChaptersPanel';
import { fetchAdminTeachers, type TeacherOption } from '@/features/courses/api';
import { ApiClientError } from '@/services/api';

const PAGE_SIZE = 10;

export function BatchesPage() {
  const [filters, setFilters] = useState<AdminBatchFilters>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<CourseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CourseSummary | null>(null);
  const [subjectsBatch, setSubjectsBatch] = useState<CourseSummary | null>(null);
  const [chaptersSubject, setChaptersSubject] = useState<BatchSubject | null>(null);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchAdminBatches(filters);
      setItems(page.items);
      setTotal(page.total);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load batches');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    void fetchAdminTeachers()
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      setFilters((prev) => {
        if (prev.search === nextSearch) return prev;
        return { ...prev, search: nextSearch, page: 1 };
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(batch: CourseSummary) {
    setEditing(batch);
    setEditorOpen(true);
  }

  function openSubjects(batch: CourseSummary) {
    setSubjectsBatch(batch);
    setChaptersSubject(null);
  }

  function closePanel() {
    setSubjectsBatch(null);
    setChaptersSubject(null);
  }

  async function onDelete(batch: CourseSummary) {
    const ok = window.confirm(
      `Delete batch “${batch.title}”?\n\nThis removes the batch, its subjects, and chapters/content. Payment history stays but is unlinked.`,
    );
    if (!ok) return;
    try {
      await deleteBatch(batch.id);
      await loadBatches();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Batches"
        description="Batch → Subject → Chapter. Create batches like Class 10 Bihar Board Batch 2026-27, attach subjects, and organize chapters."
      />

      <div className="toolbar">
        <input
          className="toolbar-search"
          placeholder="Search batch name, slug…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as AdminBatchFilters['status'],
              page: 1,
            }))
          }
        >
          <option value="all">All status</option>
          <option value="active">Published</option>
          <option value="inactive">Draft</option>
        </select>
        <button type="button" className="btn primary" onClick={openCreate}>
          + Create Batch
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Class</th>
              <th>Medium</th>
              <th>Year</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            ) : null}
            {!loading && !items.length ? (
              <tr>
                <td colSpan={7}>No batches found.</td>
              </tr>
            ) : null}
            {items.map((batch) => (
              <tr key={batch.id}>
                <td>
                  <div className="course-cell">
                    {batch.thumbnail_url ? (
                      <img src={batch.thumbnail_url} alt="" />
                    ) : (
                      <span className="thumb-fallback">{batch.title.slice(0, 1)}</span>
                    )}
                    <div>
                      <strong>{batch.title}</strong>
                      <small>{batch.slug}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {batch.class_level ? `Class ${batch.class_level}` : '—'}
                  {batch.stream ? ` · ${batch.stream}` : ''}
                </td>
                <td>
                  {batch.medium === 'hindi' ? 'Hindi' : batch.medium === 'english' ? 'English' : '—'}
                </td>
                <td>{batch.academic_year || '—'}</td>
                <td>
                  {batch.price > 0 ? `₹${Math.round(batch.price)}` : 'Free'}
                  {batch.original_price != null && batch.original_price > batch.price ? (
                    <small className="price-strike"> ₹{Math.round(batch.original_price)}</small>
                  ) : null}
                </td>
                <td>
                  <span
                    className={
                      batch.is_published ? 'badge badge-active' : 'badge badge-inactive'
                    }
                  >
                    {batch.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn ghost" onClick={() => openEdit(batch)}>
                    Edit Batch
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => openSubjects(batch)}
                  >
                    Manage Subjects
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => void onDelete(batch)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="btn ghost"
          disabled={(filters.page ?? 1) <= 1}
          onClick={() =>
            setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))
          }
        >
          Previous
        </button>
        <span>
          Page {filters.page ?? 1} of {totalPages} · {total} batches
        </span>
        <button
          type="button"
          className="btn ghost"
          disabled={(filters.page ?? 1) >= totalPages}
          onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
        >
          Next
        </button>
      </div>

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <BatchForm
              batch={editing}
              teachers={teachers}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void loadBatches();
              }}
            />
          </div>
        </div>
      ) : null}

      {subjectsBatch ? (
        <div className="modal-backdrop" role="presentation" onClick={closePanel}>
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {chaptersSubject ? (
              <SubjectChaptersPanel
                batch={subjectsBatch}
                batchSubject={chaptersSubject}
                onBack={() => setChaptersSubject(null)}
                onClose={closePanel}
              />
            ) : (
              <BatchSubjectsPanel
                batch={subjectsBatch}
                teachers={teachers}
                onClose={closePanel}
                onOpenChapters={(row) => setChaptersSubject(row)}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
