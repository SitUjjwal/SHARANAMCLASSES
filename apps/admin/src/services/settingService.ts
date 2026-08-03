/**
 * settingService — system settings + activity logs.
 */
import type {
  AdminActivityLogPage,
  PlatformGeneralSettings,
  PlatformSettingsBundle,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function fetchPlatformSettings(): Promise<PlatformSettingsBundle> {
  return apiRequest<PlatformSettingsBundle>('/settings');
}

export async function savePlatformSettings(
  general: PlatformGeneralSettings,
): Promise<PlatformSettingsBundle> {
  return apiRequest<PlatformSettingsBundle>('/settings', {
    method: 'PUT',
    body: { general },
  });
}

export async function uploadPlatformLogo(file: File): Promise<PlatformSettingsBundle> {
  const formData = new FormData();
  formData.append('logo', file);
  return apiRequest<PlatformSettingsBundle>('/settings/logo', {
    method: 'POST',
    formData,
  });
}

export async function fetchActivityLogs(params: {
  page?: number;
  pageSize?: number;
  action?: string;
  category?: string;
  search?: string;
}): Promise<AdminActivityLogPage> {
  return apiRequest<AdminActivityLogPage>('/activity-logs', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
      action: params.action,
      category: params.category,
      search: params.search,
    },
  });
}
