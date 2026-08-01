/**
 * Admin Test Series API.
 *
 * GET|POST          /tests
 * GET|PUT|DELETE    /tests/:id
 */
import type { Chapter, CourseListPage, CourseSummary, Test, TestType } from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type TestListPage = {
  items: Test[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type TestFilters = {
  courseId?: string;
  chapterId?: string;
  search?: string;
  testType?: 'all' | TestType;
  access?: 'all' | 'free' | 'paid';
  status?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
};

export type TestWritePayload = {
  title: string;
  description?: string;
  instructions?: string;
  test_type: TestType;
  course_id?: string | null;
  chapter_id?: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  sort_order?: number;
  is_free?: boolean;
  is_published?: boolean;
};

export function fetchAdminTests(filters: TestFilters = {}) {
  return apiRequest<TestListPage>('/tests', {
    params: {
      courseId: filters.courseId,
      chapterId: filters.chapterId,
      search: filters.search,
      testType: filters.testType ?? 'all',
      access: filters.access ?? 'all',
      status: filters.status ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function createAdminTest(payload: TestWritePayload) {
  return apiRequest<Test>('/tests', { method: 'POST', body: payload });
}

export function updateAdminTest(id: string, payload: Partial<TestWritePayload>) {
  return apiRequest<Test>(`/tests/${id}`, { method: 'PUT', body: payload });
}

export function deleteAdminTest(id: string) {
  return apiRequest<null>(`/tests/${id}`, { method: 'DELETE' });
}

export function fetchCoursesForTestPicker() {
  return apiRequest<CourseListPage>('/admin/courses', {
    params: { page: 1, pageSize: 100, status: 'all' },
  });
}

export function fetchChaptersForCourse(courseId: string) {
  // Admin list — unpublished courses included (student `/courses/:id/chapters` rejects drafts).
  return apiRequest<Chapter[]>('/chapters', {
    params: { courseId },
  });
}

export type { CourseSummary, Test, TestType };
