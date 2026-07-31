/**
 * Admin PDF management API — flat REST + R2 upload.
 *
 * GET|POST          /pdfs
 * GET|PUT|DELETE    /pdfs/:id
 * POST              /pdfs/upload
 */
import type { Chapter, CourseListPage, Pdf } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type PdfListPage = {
  items: Pdf[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type PdfFilters = {
  courseId?: string;
  chapterId?: string;
  search?: string;
  access?: 'free' | 'paid' | 'all';
  status?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
};

export type PdfUploadResult = {
  file_url: string;
  storage_key: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  storage_provider: 'r2' | 'supabase';
};

export type PdfWritePayload = {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  file_url: string;
  storage_key: string;
  file_size: number;
  mime_type?: 'application/pdf';
  original_filename: string;
  sort_order?: number;
  is_free?: boolean;
  is_published?: boolean;
};

export function fetchAdminPdfs(filters: PdfFilters = {}) {
  return apiRequest<PdfListPage>('/pdfs', {
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

export function createAdminPdf(payload: PdfWritePayload) {
  return apiRequest<Pdf>('/pdfs', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminPdf(pdfId: string, payload: Partial<PdfWritePayload>) {
  return apiRequest<Pdf>(`/pdfs/${pdfId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminPdf(pdfId: string) {
  return apiRequest<null>(`/pdfs/${pdfId}`, {
    method: 'DELETE',
  });
}

export async function uploadAdminPdf(file: File): Promise<PdfUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<PdfUploadResult>('/pdfs/upload', {
    method: 'POST',
    formData,
  });
}

export function fetchCoursesForPdfPicker() {
  return apiRequest<CourseListPage>('/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function fetchChaptersForCourse(courseId: string) {
  return apiRequest<Chapter[]>('/chapters', {
    params: { courseId },
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
