/**
 * Admin students API.
 */
import { apiRequest } from '@/services/api';

export type AdminStudent = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: string;
  medium: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  enrolled_courses: number;
};

export type AdminStudentListPage = {
  items: AdminStudent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type UpdateStudentPayload = {
  full_name?: string;
  phone_number?: string;
  class_level?: string;
  medium?: 'hindi' | 'english';
};

export function fetchAdminStudents(params: {
  search?: string;
  class_level?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return apiRequest<AdminStudentListPage>('/admin/students', { params });
}

export function fetchAdminStudent(studentId: string) {
  return apiRequest<AdminStudent>(`/admin/students/${studentId}`);
}

export function updateAdminStudent(studentId: string, payload: UpdateStudentPayload) {
  return apiRequest<AdminStudent>(`/admin/students/${studentId}`, {
    method: 'PATCH',
    body: payload,
  });
}
