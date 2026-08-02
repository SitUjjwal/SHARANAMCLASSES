/**
 * contentReportService — submit / list / track content quality reports.
 */
import type {
  ApiSuccessResponse,
  ContentReport,
  SubmitContentReportInput,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function submitContentReport(
  input: SubmitContentReportInput,
): Promise<ContentReport> {
  const { data } = await apiClient.post<ApiSuccessResponse<ContentReport>>(
    '/content-reports',
    input,
  );
  return data.data;
}

export async function fetchMyContentReports(): Promise<ContentReport[]> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<ContentReport[]>>('/content-reports');
  return data.data;
}

export async function fetchContentReport(
  reportId: string,
): Promise<ContentReport> {
  const { data } = await apiClient.get<ApiSuccessResponse<ContentReport>>(
    `/content-reports/${reportId}`,
  );
  return data.data;
}
