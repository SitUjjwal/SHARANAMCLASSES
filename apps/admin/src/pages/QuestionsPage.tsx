/**
 * Question Management for one test — CRUD, search, pagination, Excel import.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { Question, Test } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { QuestionForm } from '@/features/questions/QuestionForm';
import {
  deleteAdminQuestion,
  fetchAdminQuestions,
  fetchAdminTest,
  importAdminQuestionsExcel,
  type QuestionFilters,
} from '@/features/questions/api';
import { ApiClientError } from '@/services/api';

export function QuestionsPage() {
  const { testId = '' } = useParams<{ testId: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [test, setTest] = useState<Test | null>(null);
  const [filters, setFilters] = useState<QuestionFilters>({
    search: '',
    page: 1,
    pageSize: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    void fetchAdminTest(testId)
      .then(setTest)
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load test');
      });
  }, [testId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFilters((prev) => {
        const next = searchInput.trim();
        if (prev.search === next) return prev;
        return { ...prev, search: next, page: 1 };
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminQuestions(testId, filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api with npm run dev (port 4000).');
      } else {
        setError('Failed to load questions');
      }
    } finally {
      setLoading(false);
    }
  }, [testId, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(row: Question) {
    setEditing(row);
    setEditorOpen(true);
  }

  async function onDelete(row: Question) {
    const ok = window.confirm('Delete this question?');
    if (!ok) return;
    try {
      await deleteAdminQuestion(row.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  async function onImportFile(file: File | null) {
    if (!file || !testId) return;
    setImporting(true);
    setImportNote(null);
    try {
      const result = await importAdminQuestionsExcel(testId, file);
      setImportNote(
        `Imported ${result.imported}, skipped ${result.skipped}` +
          (result.errors[0]
            ? ` (first error row ${result.errors[0].row}: ${result.errors[0].message})`
            : ''),
      );
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 20)));

  if (!testId) {
    return (
      <div className="page">
        <p className="form-error">Missing test id.</p>
        <Link to="/tests">Back to Test Series</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Questions"
        description={
          test
            ? `Question bank for “${test.title}”. Four options, marks, and Excel bulk import.`
            : 'Question bank for this test.'
        }
      />

      <p className="hint">
        <Link to="/tests">← Test Series</Link>
        {test ? ` · ${test.duration_minutes} min · pass ${test.passing_marks}/${test.total_marks}` : ''}
      </p>

      <div className="toolbar">
        <input
          className="toolbar-search"
          placeholder="Search question text…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="button" className="btn primary" onClick={openCreate}>
          + Add Question
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
        >
          {importing ? 'Importing…' : 'Bulk Import Excel'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          hidden
          onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {importNote ? <p className="hint">{importNote}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="hint">
          No questions yet. Add one or import an Excel file (
          question_text, option_a–d, correct_answer, explanation, marks, negative_marks).
        </p>
      ) : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Marks</th>
              <th>−ve</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.sort_order}</td>
                <td>
                  <div className="course-cell">
                    <span>{row.question_text}</span>
                    <small>
                      A) {row.option_a} · B) {row.option_b} · C) {row.option_c} · D){' '}
                      {row.option_d}
                    </small>
                  </div>
                </td>
                <td>
                  <span className="badge badge-active">{row.correct_answer}</span>
                </td>
                <td>{row.marks}</td>
                <td>{row.negative_marks}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => void onDelete(row)}
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

      {totalPages > 1 ? (
        <div className="toolbar" style={{ marginTop: '1rem' }}>
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
          <span className="hint">
            Page {filters.page ?? 1} / {totalPages} ({total} questions)
          </span>
          <button
            type="button"
            className="btn ghost"
            disabled={(filters.page ?? 1) >= totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
            }
          >
            Next
          </button>
        </div>
      ) : null}

      {editorOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <QuestionForm
              testId={testId}
              question={editing}
              onCancel={() => setEditorOpen(false)}
              onSaved={() => {
                setEditorOpen(false);
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
