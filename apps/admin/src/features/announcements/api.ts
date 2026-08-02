/**
 * Admin announcements API client.
 */
import type { Announcement } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type AnnouncementWritePayload = {
  title: string;
  body?: string;
  image_url?: string | null;
  is_pinned?: boolean;
  is_published?: boolean;
  scheduled_at?: string;
  sort_order?: number;
};

export function fetchAdminAnnouncements() {
  return apiRequest<Announcement[]>('/admin/announcements');
}

export function createAdminAnnouncement(payload: AnnouncementWritePayload) {
  return apiRequest<Announcement>('/admin/announcements', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminAnnouncement(
  announcementId: string,
  payload: Partial<AnnouncementWritePayload>,
) {
  return apiRequest<Announcement>(`/admin/announcements/${announcementId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAdminAnnouncement(announcementId: string) {
  return apiRequest<null>(`/admin/announcements/${announcementId}`, {
    method: 'DELETE',
  });
}

export async function uploadAnnouncementImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const data = await apiRequest<{ url: string }>('/admin/announcements/upload-image', {
    method: 'POST',
    formData,
  });
  return data.url;
}
