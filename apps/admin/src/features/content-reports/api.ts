/**
 * Admin content reports API.
 */
import type {
  AdminContentReport,
  ContentReport,
  ContentReportStatus,
  ContentReportType,
  UpdateContentReportStatusInput,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export function listAdminContentReports(params?: {
  status?: ContentReportStatus;
  report_type?: ContentReportType;
}) {
  return apiRequest<AdminContentReport[]>('/admin/content-reports', {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.report_type ? { report_type: params.report_type } : {}),
    },
  });
}

export function updateAdminContentReport(
  reportId: string,
  body: UpdateContentReportStatusInput,
) {
  return apiRequest<ContentReport>(`/admin/content-reports/${reportId}`, {
    method: 'PATCH',
    body,
  });
}
