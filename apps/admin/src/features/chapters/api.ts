/**
 * Admin chapter management API — flat REST (Bearer + admin role).
 *
 * GET    /courses?status=all&pageSize=100  → course picker
 * GET    /chapters?courseId=&search=       → list / search
 * POST   /chapters                         → create { course_id, … }
 * PUT    /chapters/:id                     → update
 * DELETE /chapters/:id                     → delete
 * PUT    /chapters/reorder                 → { courseId, orderedIds }
 * GET|POST /chapters/:id/contents          → list / add video·pdf·note
 * PUT|DELETE /contents/:id                 → update / delete content
 */
import type { Chapter, ChapterContentItem, CourseListPage, CourseSummary } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type ChapterWritePayload = {
  title: string;
  description?: string;
  sort_order?: number;
  video_url?: string | null;
  duration_seconds?: number;
  video_count?: number;
  pdf_count?: number;
  notes_count?: number;
  is_free_preview?: boolean;
  is_published?: boolean;
};

export type ChapterContentWritePayload = {
  content_type: 'video' | 'pdf' | 'note';
  title: string;
  url?: string | null;
  body?: string | null;
  duration_seconds?: number | null;
  sort_order?: number;
};

export function fetchCoursesForChapterPicker() {
  return apiRequest<CourseListPage>('/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function fetchAdminChapters(courseId: string, search?: string) {
  return apiRequest<Chapter[]>('/chapters', {
    params: { courseId, search },
  });
}

export function createAdminChapter(courseId: string, payload: ChapterWritePayload) {
  return apiRequest<Chapter>('/chapters', {
    method: 'POST',
    body: { ...payload, course_id: courseId },
  });
}

export function updateAdminChapter(chapterId: string, payload: Partial<ChapterWritePayload>) {
  return apiRequest<Chapter>(`/chapters/${chapterId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminChapter(chapterId: string) {
  return apiRequest<null>(`/chapters/${chapterId}`, {
    method: 'DELETE',
  });
}

export function reorderAdminChapters(courseId: string, orderedIds: string[]) {
  return apiRequest<Chapter[]>('/chapters/reorder', {
    method: 'PUT',
    body: { courseId, orderedIds },
  });
}

export function fetchChapterContents(chapterId: string) {
  return apiRequest<ChapterContentItem[]>(`/chapters/${chapterId}/contents`);
}

export function createChapterContent(chapterId: string, payload: ChapterContentWritePayload) {
  return apiRequest<ChapterContentItem>(`/chapters/${chapterId}/contents`, {
    method: 'POST',
    body: payload,
  });
}

export function updateChapterContent(
  contentId: string,
  payload: Partial<ChapterContentWritePayload>,
) {
  return apiRequest<ChapterContentItem>(`/contents/${contentId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteChapterContent(contentId: string) {
  return apiRequest<null>(`/contents/${contentId}`, {
    method: 'DELETE',
  });
}

/** Upload PDF / notes file → public URL */
export async function uploadChapterMaterial(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const data = await apiRequest<{ url: string }>('/chapters/upload-material', {
    method: 'POST',
    formData,
  });
  return data.url;
}

export type { CourseSummary };
