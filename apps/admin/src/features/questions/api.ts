/**
 * Admin Question Management API.
 */
import type {
  Question,
  QuestionBulkImportResult,
  QuestionCorrectAnswer,
  Test,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type QuestionListPage = {
  items: Question[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type QuestionFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type QuestionWritePayload = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: QuestionCorrectAnswer;
  explanation?: string;
  marks: number;
  negative_marks?: number;
  sort_order?: number;
};

export function fetchAdminTest(testId: string) {
  return apiRequest<Test>(`/tests/${testId}`);
}

export function fetchAdminQuestions(testId: string, filters: QuestionFilters = {}) {
  return apiRequest<QuestionListPage>(`/tests/${testId}/questions`, {
    params: {
      search: filters.search,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
}

export function createAdminQuestion(testId: string, payload: QuestionWritePayload) {
  return apiRequest<Question>(`/tests/${testId}/questions`, {
    method: 'POST',
    body: payload,
  });
}

export function updateAdminQuestion(id: string, payload: Partial<QuestionWritePayload>) {
  return apiRequest<Question>(`/questions/${id}`, { method: 'PUT', body: payload });
}

export function deleteAdminQuestion(id: string) {
  return apiRequest<null>(`/questions/${id}`, { method: 'DELETE' });
}

export function importAdminQuestionsExcel(testId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<QuestionBulkImportResult>(`/tests/${testId}/questions/import`, {
    method: 'POST',
    formData,
  });
}

export type { Question, QuestionCorrectAnswer, Test };
