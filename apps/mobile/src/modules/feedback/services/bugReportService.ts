/**
 * bugReportService — submit / list / track bug reports.
 */
import type { ApiSuccessResponse, BugReport, BugReportScreenKey } from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function submitBugReport(input: {
  description: string;
  screen_key: BugReportScreenKey;
  screenshotUri?: string | null;
  screenshotMimeType?: string | null;
}): Promise<BugReport> {
  const formData = new FormData();
  formData.append('description', input.description);
  formData.append('screen_key', input.screen_key);

  if (input.screenshotUri && input.screenshotMimeType) {
    const ext =
      input.screenshotMimeType === 'image/png'
        ? 'png'
        : input.screenshotMimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
    formData.append('screenshot', {
      uri: input.screenshotUri,
      name: `bug-screenshot.${ext}`,
      type: input.screenshotMimeType,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<ApiSuccessResponse<BugReport>>(
    '/bug-reports',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    },
  );
  return data.data;
}

export async function fetchMyBugReports(): Promise<BugReport[]> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<BugReport[]>>('/bug-reports');
  return data.data;
}

export async function fetchBugReport(reportId: string): Promise<BugReport> {
  const { data } = await apiClient.get<ApiSuccessResponse<BugReport>>(
    `/bug-reports/${reportId}`,
  );
  return data.data;
}
