/**
 * Admin batch management API — Batch → Subject → Chapter architecture.
 *
 * A "Batch" is a course row; the API reuses course semantics under /batches.
 * Subjects are a master catalog attached to batches via batch_subjects.
 */
import type {
  BatchSubject,
  Chapter,
  CourseListPage,
  CourseSummary,
  Subject,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type AdminBatchFilters = {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
};

export type BatchWritePayload = {
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string | null;
  class_level?: string | null;
  medium?: 'hindi' | 'english' | null;
  stream?: 'science' | 'arts' | 'commerce' | null;
  board?: 'bihar_board' | 'other' | null;
  academic_year?: string | null;
  teacher_id?: string | null;
  category_id?: string | null;
  price?: number;
  original_price?: number | null;
  discount_percent?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_published?: boolean;
};

export type SubjectWritePayload = {
  name: string;
  code?: string | null;
  description?: string;
  icon_url?: string | null;
  thumbnail_url?: string | null;
  status?: 'active' | 'inactive';
};

export type AddBatchSubjectInput = {
  subject_id?: string;
  name?: string;
  teacher_id?: string | null;
  sort_order?: number;
};

export type BatchSubjectPatchPayload = {
  teacher_id?: string | null;
  sort_order?: number;
  status?: 'active' | 'inactive';
};

export type BatchChapterWritePayload = {
  title: string;
  description?: string;
  sort_order?: number;
  is_free_preview?: boolean;
  is_published?: boolean;
};

export function fetchAdminBatches(filters: AdminBatchFilters = {}) {
  return apiRequest<CourseListPage>('/batches', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
    },
  });
}

export function createBatch(payload: BatchWritePayload) {
  return apiRequest<CourseSummary>('/batches', {
    method: 'POST',
    body: payload,
  });
}

export function updateBatch(batchId: string, payload: Partial<BatchWritePayload>) {
  return apiRequest<CourseSummary>(`/batches/${batchId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteBatch(batchId: string) {
  return apiRequest<null>(`/batches/${batchId}`, {
    method: 'DELETE',
  });
}

export function fetchSubjects(filters: { search?: string; status?: 'all' | 'active' | 'inactive' } = {}) {
  return apiRequest<Subject[]>('/subjects', {
    params: {
      search: filters.search,
      status: filters.status ?? 'all',
    },
  });
}

export function createSubject(payload: SubjectWritePayload) {
  return apiRequest<Subject>('/subjects', {
    method: 'POST',
    body: payload,
  });
}

export function updateSubject(subjectId: string, payload: Partial<SubjectWritePayload>) {
  return apiRequest<Subject>(`/subjects/${subjectId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteSubject(subjectId: string) {
  return apiRequest<null>(`/subjects/${subjectId}`, {
    method: 'DELETE',
  });
}

export function fetchBatchSubjects(batchId: string) {
  return apiRequest<BatchSubject[]>(`/batches/${batchId}/subjects`);
}

export function addSubjectsToBatch(batchId: string, subjects: AddBatchSubjectInput[]) {
  return apiRequest<BatchSubject[]>(`/batches/${batchId}/subjects`, {
    method: 'POST',
    body: { subjects },
  });
}

export function reorderBatchSubjects(batchId: string, orderedIds: string[]) {
  return apiRequest<BatchSubject[]>(`/batches/${batchId}/subjects/reorder`, {
    method: 'PUT',
    body: { orderedIds },
  });
}

export function removeSubjectFromBatch(batchId: string, subjectId: string) {
  return apiRequest<null>(`/batches/${batchId}/subjects/${subjectId}`, {
    method: 'DELETE',
  });
}

export function updateBatchSubject(batchSubjectId: string, payload: BatchSubjectPatchPayload) {
  return apiRequest<BatchSubject>(`/batch-subjects/${batchSubjectId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function fetchBatchSubjectChapters(batchSubjectId: string) {
  return apiRequest<Chapter[]>(`/batch-subjects/${batchSubjectId}/chapters`);
}

export function createBatchSubjectChapter(
  batchSubjectId: string,
  payload: BatchChapterWritePayload,
) {
  return apiRequest<Chapter>(`/batch-subjects/${batchSubjectId}/chapters`, {
    method: 'POST',
    body: payload,
  });
}
