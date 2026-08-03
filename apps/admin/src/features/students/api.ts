/**
 * Admin students API client.
 */
import type {
  AdminExcelExport,
  AdminStudent,
  AdminStudentCourse,
  AdminStudentListPage,
  AdminStudentPaymentItem,
  AdminStudentResetPasswordResult,
  AdminStudentTestHistoryItem,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export type {
  AdminStudent,
  AdminStudentCourse,
  AdminStudentListPage,
  AdminStudentPaymentItem,
  AdminStudentTestHistoryItem,
};

export type UpdateStudentPayload = {
  full_name?: string;
  phone_number?: string;
  class_level?: string;
  medium?: 'hindi' | 'english';
};

export type ListStudentsParams = {
  search?: string;
  class_level?: string;
  medium?: string;
  status?: 'all' | 'active' | 'suspended';
  page?: number;
  pageSize?: number;
};

export function fetchAdminStudents(params: ListStudentsParams = {}) {
  return apiRequest<AdminStudentListPage>('/students', { params });
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

export function suspendAdminStudent(studentId: string, reason?: string) {
  return apiRequest<AdminStudent>(`/admin/students/${studentId}/suspend`, {
    method: 'POST',
    body: { reason },
  });
}

export function activateAdminStudent(studentId: string) {
  return apiRequest<AdminStudent>(`/admin/students/${studentId}/activate`, {
    method: 'POST',
  });
}

export function resetAdminStudentPassword(studentId: string, newPassword?: string) {
  return apiRequest<AdminStudentResetPasswordResult>(
    `/admin/students/${studentId}/reset-password`,
    {
      method: 'POST',
      body: newPassword ? { new_password: newPassword } : {},
    },
  );
}

export function fetchAdminStudentCourses(studentId: string) {
  return apiRequest<AdminStudentCourse[]>(`/admin/students/${studentId}/courses`);
}

export function fetchAdminStudentTests(studentId: string) {
  return apiRequest<AdminStudentTestHistoryItem[]>(
    `/admin/students/${studentId}/tests`,
  );
}

export function fetchAdminStudentPayments(studentId: string) {
  return apiRequest<AdminStudentPaymentItem[]>(
    `/admin/students/${studentId}/payments`,
  );
}

export function exportAdminStudentsExcel(params: ListStudentsParams = {}) {
  return apiRequest<AdminExcelExport>('/admin/students/export', { params });
}

export function downloadBase64File(filename: string, base64: string, mime: string): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
