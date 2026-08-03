/**
 * reportService — report catalog + multi-format export (CSV / Excel / PDF).
 */
import type {
  AdminCsvExport,
  AdminReportFileExport,
  AdminReportFormat,
  AdminReportSummary,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function listAdminReports(): Promise<AdminReportSummary[]> {
  return apiRequest<AdminReportSummary[]>('/reports');
}

export async function exportAdminReport(
  key: string,
  format: AdminReportFormat,
): Promise<AdminReportFileExport> {
  return apiRequest<AdminReportFileExport>(`/reports/${key}/export`, {
    params: { format },
  });
}

/** @deprecated Prefer exportAdminReport */
export async function exportReportCsv(path: string): Promise<AdminCsvExport> {
  return apiRequest<AdminCsvExport>(path);
}

export async function exportActivityLogsCsv(params: {
  action?: string;
  category?: string;
  search?: string;
} = {}): Promise<AdminCsvExport> {
  return apiRequest<AdminCsvExport>('/activity-logs/export', {
    params: {
      action: params.action,
      category: params.category,
      search: params.search,
    },
  });
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBase64File(
  filename: string,
  base64: string,
  mime: string,
): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
