/**
 * Admin live class API — flat REST.
 *
 * GET|POST          /live-classes
 * GET|PUT|DELETE    /live-classes/:id
 * POST              /live-classes/upload-thumbnail
 * POST              /live-classes/:id/notify
 */
import type { CourseListPage, LiveClass } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type LiveClassListPage = {
  items: LiveClass[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type LiveClassFilters = {
  courseId?: string;
  search?: string;
  status?: 'all' | 'upcoming' | 'live' | 'ended';
  publishStatus?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
};

export type LiveClassWritePayload = {
  course_id?: string | null;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string | null;
  start_time: string;
  end_time: string;
  is_published?: boolean;
};

export function fetchAdminLiveClasses(filters: LiveClassFilters = {}) {
  return apiRequest<LiveClassListPage>('/live-classes', {
    params: {
      courseId: filters.courseId,
      search: filters.search,
      status: filters.status ?? 'all',
      publishStatus: filters.publishStatus ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function createAdminLiveClass(payload: LiveClassWritePayload) {
  return apiRequest<LiveClass>('/live-classes', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminLiveClass(
  liveClassId: string,
  payload: Partial<LiveClassWritePayload>,
) {
  return apiRequest<LiveClass>(`/live-classes/${liveClassId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminLiveClass(liveClassId: string) {
  return apiRequest<null>(`/live-classes/${liveClassId}`, {
    method: 'DELETE',
  });
}

export async function uploadLiveClassThumbnail(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const data = await apiRequest<{ url: string }>('/live-classes/upload-thumbnail', {
    method: 'POST',
    formData,
  });
  return data.url;
}

export function notifyAdminLiveClass(
  liveClassId: string,
  payload?: { title?: string; body?: string },
) {
  return apiRequest<LiveClass>(`/live-classes/${liveClassId}/notify`, {
    method: 'POST',
    body: payload ?? {},
  });
}

export function fetchCoursesForLiveClassPicker() {
  return apiRequest<CourseListPage>('/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function isValidYouTubeUrlClient(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return true;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const okHost =
      host === 'youtu.be' ||
      host === 'www.youtu.be' ||
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com';
    if (!okHost) return false;
    if (url.searchParams.get('v')) return true;
    return /\/(embed|live|shorts|v)\//.test(url.pathname) || host.includes('youtu.be');
  } catch {
    return false;
  }
}

/** datetime-local value ↔ ISO */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}
