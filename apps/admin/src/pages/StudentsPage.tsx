/**
 * Students management — list, search, filter, view detail, export Excel.
 */
import { useCallback, useEffect, useState } from 'react';

import { ExportButton } from '@/components/ExportButton';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { StudentDetailPanel } from '@/features/students/StudentDetailPanel';
import { StudentEditForm } from '@/features/students/StudentEditForm';
import {
  downloadBase64File,
  exportAdminStudentsExcel,
  fetchAdminStudents,
  type AdminStudent,
} from '@/features/students/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiClientError } from '@/services/api';

const CLASS_FILTERS = [
  '',
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

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function StudentsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<AdminStudent[]>([]);
  const [search, setSearch] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [medium, setMedium] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminStudent | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const listParams = {
    search: search.trim() || undefined,
    class_level: classLevel || undefined,
    medium: medium || undefined,
    status,
    page,
    pageSize: 25,
  };

  const load = useCallback(async () => {
    if (!can('students:manage')) {
      setLoading(false);
      setError('You do not have permission to manage students.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStudents(listParams);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [can, search, classLevel, medium, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, classLevel, medium, status]);

  const onExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const file = await exportAdminStudentsExcel({
        search: search.trim() || undefined,
        class_level: classLevel || undefined,
        medium: medium || undefined,
        status,
      });
      downloadBase64File(file.filename, file.base64, file.mime);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!can('students:manage')) {
    return (
      <div className="page">
        <PageHeader title="Students" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Students"
        description="Search, filter, suspend/activate, reset password, courses, tests, payments, Excel export."
        actions={
          <ExportButton
            label="Export Excel"
            loading={exporting}
            onClick={() => void onExport()}
          />
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        statusValue={status}
        statusOptions={[
          { value: 'all', label: 'All statuses' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
        ]}
        onStatusChange={(value) =>
          setStatus(value as 'all' | 'active' | 'suspended')
        }
        actions={
          <>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              aria-label="Filter by class"
            >
              <option value="">All classes</option>
              {CLASS_FILTERS.filter(Boolean).map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
            <select
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              aria-label="Filter by medium"
            >
              <option value="">All mediums</option>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
            <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading ? (
        <p className="hint">
          {total} student{total === 1 ? '' : 's'}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="hint">No students match this filter.</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Medium</th>
                <th>Status</th>
                <th>Courses</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((student) => (
                <tr key={student.id}>
                  <td>{student.full_name}</td>
                  <td>{student.email}</td>
                  <td>{student.phone_number || '—'}</td>
                  <td>{student.class_level || '—'}</td>
                  <td>{student.medium || '—'}</td>
                  <td>
                    <span
                      className={
                        student.is_suspended ? 'status-pill warn' : 'status-pill ok'
                      }
                    >
                      {student.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>{student.enrolled_courses}</td>
                  <td>{formatDate(student.created_at)}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setViewingId(student.id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setEditing(student)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="toolbar" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}

      {viewingId ? (
        <StudentDetailPanel
          studentId={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={() => void load()}
          onEdit={(student) => {
            setViewingId(null);
            setEditing(student);
          }}
        />
      ) : null}

      {editing ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setEditing(null)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Edit student"
            onClick={(e) => e.stopPropagation()}
          >
            <StudentEditForm
              student={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
