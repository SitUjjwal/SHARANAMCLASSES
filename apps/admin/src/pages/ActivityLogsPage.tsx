/**
 * ActivityLogsPage — audit trail with category/action filters + pagination.
 */
import { useCallback, useEffect, useState } from 'react';

import type { AdminActivityLog } from '@sharanam/shared';

import { DataTable } from '@/components/DataTable';
import { ExportButton } from '@/components/ExportButton';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiClientError } from '@/services/api';
import { downloadCsv, exportActivityLogsCsv } from '@/services/reportService';
import { fetchActivityLogs } from '@/services/settingService';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'auth', label: 'Login / Logout' },
  { value: 'payment', label: 'Payment' },
  { value: 'profile', label: 'Profile Update' },
  { value: 'course', label: 'Course Purchase' },
  { value: 'admin', label: 'Admin Actions' },
] as const;

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'auth.login', label: 'Login' },
  { value: 'auth.logout', label: 'Logout' },
  { value: 'payment.completed', label: 'Payment' },
  { value: 'profile.update', label: 'Profile update' },
  { value: 'course.purchase', label: 'Course purchase' },
  { value: 'course.enroll', label: 'Free enroll' },
  { value: 'settings.update', label: 'Settings' },
  { value: 'student.update', label: 'Student update' },
  { value: 'student.suspend', label: 'Student suspend' },
  { value: 'student.activate', label: 'Student activate' },
  { value: 'student.reset_password', label: 'Reset password' },
  { value: 'teacher.create', label: 'Teacher create' },
  { value: 'teacher.update', label: 'Teacher update' },
  { value: 'teacher.remove', label: 'Teacher remove' },
  { value: 'teacher.assign_courses', label: 'Assign courses' },
  { value: 'teacher.assign_live_classes', label: 'Assign live classes' },
] as const;

const PAGE_SIZE = 25;

export function ActivityLogsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<AdminActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityLogs({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        action: action === 'all' ? undefined : action,
        category: category === 'all' ? undefined : category,
      });
      setRows(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load activity logs');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, action, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const onExport = async () => {
    if (!can('reports:export')) return;
    setExporting(true);
    try {
      const file = await exportActivityLogsCsv({
        search: search.trim() || undefined,
        action: action === 'all' ? undefined : action,
        category: category === 'all' ? undefined : category,
      });
      downloadCsv(file.filename, file.csv);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Activity Logs"
        description="Login, logout, payments, profile updates, course purchases, and admin actions. Apply migration 20260803010000 if empty."
        actions={
          can('reports:export') ? (
            <ExportButton loading={exporting} onClick={() => void onExport()} />
          ) : null
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        searchPlaceholder="Search summary…"
        statusValue={category}
        statusOptions={[...CATEGORY_OPTIONS]}
        onStatusChange={(value) => {
          setPage(1);
          setCategory(value);
        }}
        actions={
          <>
            <select
              value={action}
              onChange={(e) => {
                setPage(1);
                setAction(e.target.value);
              }}
              aria-label="Filter action"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading logs…</p> : null}
      <p className="hint">
        {total} event{total === 1 ? '' : 's'}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
      </p>

      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage="No activity logged yet."
        columns={[
          {
            key: 'when',
            header: 'When',
            render: (row) => new Date(row.created_at).toLocaleString('en-IN'),
          },
          {
            key: 'actor',
            header: 'Actor',
            render: (row) => row.actor_email ?? row.actor_id ?? '—',
          },
          {
            key: 'action',
            header: 'Action',
            render: (row) => <code className="hint">{row.action}</code>,
          },
          {
            key: 'summary',
            header: 'Summary',
            render: (row) => row.summary,
          },
        ]}
      />

      <div className="toolbar" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn ghost"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="hint">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn ghost"
          disabled={loading || page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
