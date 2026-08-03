/**
 * ReportsPage — generate Student / Payment / Revenue / Course /
 * Attendance / Teacher reports as CSV, Excel, or PDF.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  AdminReportFormat,
  AdminReportSummary,
} from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiClientError } from '@/services/api';
import {
  downloadBase64File,
  exportAdminReport,
  listAdminReports,
} from '@/services/reportService';

const FORMAT_LABEL: Record<AdminReportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
};

export function ReportsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<AdminReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminReports());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onExport = async (key: string, format: AdminReportFormat) => {
    if (!can('reports:export')) return;
    const token = `${key}:${format}`;
    setExporting(token);
    setError(null);
    setLastExport(null);
    try {
      const file = await exportAdminReport(key, format);
      downloadBase64File(file.filename, file.base64, file.mime);
      setLastExport(
        `${file.title} · ${FORMAT_LABEL[format]} · ${file.row_count} row(s)`,
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (!can('reports:export') && !can('analytics:view')) {
    return (
      <div className="page">
        <PageHeader title="Reports" description="Access restricted." />
        <p className="form-error">You do not have permission to export reports.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Reports"
        description="Generate Student, Payment, Revenue, Course, Attendance, and Teacher reports — export as PDF, Excel, or CSV."
        actions={
          <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {lastExport ? <p className="hint">Downloaded: {lastExport}</p> : null}
      {loading ? <p className="hint">Loading reports…</p> : null}

      <div className="reports-grid">
        {rows.map((row) => (
          <article key={row.key} className="report-card">
            <header>
              <h2>{row.title}</h2>
              <p className="hint">{row.description}</p>
            </header>
            <div className="report-card-actions">
              {row.href ? (
                <Link className="btn ghost" to={row.href}>
                  Open
                </Link>
              ) : null}
              {can('reports:export')
                ? (row.formats ?? ['csv', 'xlsx', 'pdf']).map((format) => (
                    <button
                      key={format}
                      type="button"
                      className="btn"
                      disabled={exporting === `${row.key}:${format}`}
                      onClick={() => void onExport(row.key, format)}
                    >
                      {exporting === `${row.key}:${format}`
                        ? '…'
                        : FORMAT_LABEL[format]}
                    </button>
                  ))
                : null}
            </div>
          </article>
        ))}
      </div>

      {!loading && rows.length === 0 ? (
        <p className="hint">No reports configured.</p>
      ) : null}
    </div>
  );
}
