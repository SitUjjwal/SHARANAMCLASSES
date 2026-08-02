/**
 * Admin bug reports API.
 */
import type {
  AdminBugReport,
  BugReport,
  BugReportStatus,
  UpdateBugReportStatusInput,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function listAdminBugReports(params?: {
  status?: BugReportStatus;
}): Promise<AdminBugReport[]> {
  return apiRequest<AdminBugReport[]>('/admin/bug-reports', {
    params: params?.status ? { status: params.status } : undefined,
  });
}

export async function updateAdminBugReport(
  reportId: string,
  body: UpdateBugReportStatusInput,
): Promise<BugReport> {
  return apiRequest<BugReport>(`/admin/bug-reports/${reportId}`, {
    method: 'PATCH',
    body,
  });
}
