/**
 * Admin banner slider API.
 */
import type { Banner } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type BannerWritePayload = {
  title: string;
  subtitle?: string | null;
  image: string;
  redirect_url?: string | null;
  status?: 'active' | 'inactive';
  sort_order?: number;
};

export function fetchAdminBanners() {
  return apiRequest<Banner[]>('/admin/banners');
}

export function createAdminBanner(payload: BannerWritePayload) {
  return apiRequest<Banner>('/admin/banners', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminBanner(bannerId: string, payload: Partial<BannerWritePayload>) {
  return apiRequest<Banner>(`/admin/banners/${bannerId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAdminBanner(bannerId: string) {
  return apiRequest<null>(`/admin/banners/${bannerId}`, {
    method: 'DELETE',
  });
}

/** Reuse course thumbnail uploader for banner images */
export async function uploadBannerImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const data = await apiRequest<{ url: string }>('/courses/upload-thumbnail', {
    method: 'POST',
    formData,
  });
  return data.url;
}
