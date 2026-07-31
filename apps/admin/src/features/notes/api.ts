/**
 * Admin notes management API — flat REST.
 *
 * GET|POST /notes
 * GET|PUT|DELETE /notes/:id
 */
import type { Chapter, CourseListPage, Note } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type NoteListPage = {
  items: Note[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type NoteFilters = {
  courseId?: string;
  chapterId?: string;
  search?: string;
  access?: 'free' | 'paid' | 'all';
  status?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
};

export type NoteWritePayload = {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  notes_url: string;
  sort_order?: number;
  is_free?: boolean;
  is_published?: boolean;
};

export function fetchAdminNotes(filters: NoteFilters = {}) {
  return apiRequest<NoteListPage>('/notes', {
    params: {
      courseId: filters.courseId,
      chapterId: filters.chapterId,
      search: filters.search,
      access: filters.access ?? 'all',
      status: filters.status ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function createAdminNote(payload: NoteWritePayload) {
  return apiRequest<Note>('/notes', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminNote(noteId: string, payload: Partial<NoteWritePayload>) {
  return apiRequest<Note>(`/notes/${noteId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminNote(noteId: string) {
  return apiRequest<null>(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export function fetchCoursesForNotePicker() {
  return apiRequest<CourseListPage>('/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function fetchChaptersForCourse(courseId: string) {
  return apiRequest<Chapter[]>('/chapters', {
    params: { courseId },
  });
}

/** Client-side mirror of API HTTPS-only notes URL check */
export function isSafeNotesUrlClient(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1') return false;
    return true;
  } catch {
    return false;
  }
}
