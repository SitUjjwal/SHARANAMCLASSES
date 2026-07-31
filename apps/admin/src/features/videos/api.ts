/**
 * Admin video management API — flat REST.
 *
 * GET|POST /videos
 * GET|PUT|DELETE /videos/:id
 * POST /videos/upload-thumbnail
 */
import type { Chapter, CourseListPage, Video } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type VideoListPage = {
  items: Video[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type VideoFilters = {
  courseId?: string;
  chapterId?: string;
  search?: string;
  videoType?: 'recorded' | 'live' | 'all';
  access?: 'free' | 'paid' | 'all';
  status?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
};

export type VideoWritePayload = {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  youtube_url: string;
  video_type?: 'recorded' | 'live';
  thumbnail_url?: string | null;
  duration_seconds?: number;
  sort_order?: number;
  is_free?: boolean;
  is_published?: boolean;
};

export function fetchAdminVideos(filters: VideoFilters = {}) {
  return apiRequest<VideoListPage>('/videos', {
    params: {
      courseId: filters.courseId,
      chapterId: filters.chapterId,
      search: filters.search,
      videoType: filters.videoType ?? 'all',
      access: filters.access ?? 'all',
      status: filters.status ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function createAdminVideo(payload: VideoWritePayload) {
  return apiRequest<Video>('/videos', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminVideo(videoId: string, payload: Partial<VideoWritePayload>) {
  return apiRequest<Video>(`/videos/${videoId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminVideo(videoId: string) {
  return apiRequest<null>(`/videos/${videoId}`, {
    method: 'DELETE',
  });
}

export async function uploadVideoThumbnail(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const data = await apiRequest<{ url: string }>('/videos/upload-thumbnail', {
    method: 'POST',
    formData,
  });
  return data.url;
}

export function fetchCoursesForVideoPicker() {
  return apiRequest<CourseListPage>('/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function fetchChaptersForCourse(courseId: string) {
  return apiRequest<Chapter[]>('/chapters', {
    params: { courseId },
  });
}

/** Client-side YouTube URL check (mirrors API) */
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
