/**
 * Admin course management API — flat REST.
 */
import type { Category, CourseListPage, CourseSummary } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type TeacherOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type AdminCourseFilters = {
  search?: string;
  categoryId?: string;
  status?: 'all' | 'active' | 'inactive';
  price?: 'all' | 'free' | 'paid';
  page?: number;
  pageSize?: number;
};

export type CourseWritePayload = {
  title: string;
  slug: string;
  description?: string;
  category_id?: string | null;
  thumbnail_url?: string | null;
  class_level?: string | null;
  medium?: 'hindi' | 'english' | null;
  stream?: 'science' | 'arts' | 'commerce' | null;
  board?: 'bihar_board' | 'other' | null;
  academic_year?: string | null;
  subject?: string | null;
  teacher_id?: string | null;
  language?: 'hindi' | 'english' | null;
  teacher_name?: string | null;
  price?: number;
  is_free?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  sort_order?: number;
  rating?: number;
};

export function fetchAdminCourses(filters: AdminCourseFilters = {}) {
  return apiRequest<CourseListPage>('/courses', {
    params: {
      search: filters.search,
      categoryId: filters.categoryId,
      status: filters.status ?? 'all',
      price: filters.price ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    },
  });
}

export function fetchAdminCourse(courseId: string) {
  return apiRequest<CourseSummary>(`/courses/${courseId}`);
}

export function createAdminCourse(payload: CourseWritePayload) {
  return apiRequest<CourseSummary>('/courses', {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminCourse(courseId: string, payload: Partial<CourseWritePayload>) {
  return apiRequest<CourseSummary>(`/courses/${courseId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminCourse(courseId: string) {
  return apiRequest<null>(`/courses/${courseId}`, {
    method: 'DELETE',
  });
}

export async function uploadCourseThumbnail(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const data = await apiRequest<{ url: string }>('/courses/upload-thumbnail', {
    method: 'POST',
    formData,
  });
  return data.url;
}

export function fetchAdminCategories() {
  return apiRequest<Category[]>('/categories');
}

export function createAdminCategory(payload: {
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: payload,
  });
}

export function fetchAdminTeachers() {
  return apiRequest<TeacherOption[]>('/admin/teachers');
}

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}
